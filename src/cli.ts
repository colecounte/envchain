import { resolveEnv } from "./resolver";
import { validateEnvMap, formatValidationIssues } from "./validator";
import { applySchema } from "./schema";
import { formatEnvMap, OutputFormat } from "./formatter";

export interface ParsedArgs {
  context: string;
  dir: string;
  format: OutputFormat;
  strict: boolean;
  help: boolean;
}

export function parseArgs(argv: string[]): ParsedArgs {
  const args: ParsedArgs = {
    context: "local",
    dir: process.cwd(),
    format: "dotenv",
    strict: false,
    help: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      args.help = true;
    } else if (arg === "--strict") {
      args.strict = true;
    } else if ((arg === "--context" || arg === "-c") && argv[i + 1]) {
      args.context = argv[++i];
    } else if ((arg === "--dir" || arg === "-d") && argv[i + 1]) {
      args.dir = argv[++i];
    } else if ((arg === "--format" || arg === "-f") && argv[i + 1]) {
      args.format = argv[++i] as OutputFormat;
    }
  }

  return args;
}

export function printHelp(): void {
  console.log(`
envchain — cascading .env manager

Usage: envchain [options]

Options:
  -c, --context <name>   Context to resolve (default: local)
  -d, --dir <path>       Root directory to search for .env files (default: cwd)
  -f, --format <fmt>     Output format: dotenv | export | json | csv (default: dotenv)
  --strict               Exit with error if validation issues are found
  -h, --help             Show this help message
`.trim());
}

export async function run(argv: string[]): Promise<void> {
  const args = parseArgs(argv);

  if (args.help) {
    printHelp();
    return;
  }

  const env = await resolveEnv(args.context, args.dir);
  const issues = validateEnvMap(env);

  if (issues.length > 0) {
    const msg = formatValidationIssues(issues);
    if (args.strict) {
      console.error(msg);
      process.exit(1);
    } else {
      console.warn(msg);
    }
  }

  const coerced = applySchema(env);
  const output = formatEnvMap(coerced, args.format);
  process.stdout.write(output);
}
