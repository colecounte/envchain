import { loadEnv } from "./loader";
import { injectEnvMap, formatInjectResult, InjectOptions } from "./injector";

function printUsage() {
  console.log(`
Usage: envchain inject [options] <context>

Injects resolved env variables into process.env and spawns a command.

Options:
  --override        Override existing environment variables
  --prefix <str>    Prefix all injected keys
  --dry-run         Show what would be injected without modifying env
  --context <name>  Context to load (default: local)
  --help            Show this help message
`);
}

export interface InjectCliArgs {
  context: string;
  options: InjectOptions;
  help: boolean;
}

export function parseInjectArgs(argv: string[]): InjectCliArgs {
  const args: InjectCliArgs = {
    context: "local",
    options: { override: false, prefix: "", dryRun: false },
    help: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help") {
      args.help = true;
    } else if (arg === "--override") {
      args.options.override = true;
    } else if (arg === "--dry-run") {
      args.options.dryRun = true;
    } else if (arg === "--prefix" && argv[i + 1]) {
      args.options.prefix = argv[++i];
    } else if (arg === "--context" && argv[i + 1]) {
      args.context = argv[++i];
    } else if (!arg.startsWith("--")) {
      args.context = arg;
    }
  }

  return args;
}

export async function runInjectCli(argv: string[]): Promise<void> {
  const parsed = parseInjectArgs(argv);

  if (parsed.help) {
    printUsage();
    return;
  }

  const envMap = await loadEnv({ context: parsed.context });
  const result = injectEnvMap(envMap, process.env, parsed.options);
  const summary = formatInjectResult(result);

  if (summary) {
    console.log(summary);
  } else {
    console.log("Nothing to inject.");
  }
}
