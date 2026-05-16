/**
 * planner-cli.ts — CLI entry point for the `envchain plan` subcommand.
 * Shows a dry-run execution plan without loading env into the process.
 */

import { envFileCandidates, readEnvFile } from "./resolver";
import { buildPlan, formatPlan } from "./planner";

export function printUsage(): void {
  console.log(`
Usage: envchain plan [options]

Options:
  --context, -c <ctx>   Context to plan for (default: local)
  --cwd <dir>           Working directory (default: process.cwd())
  --json                Output plan as JSON
  --help, -h            Show this help

Examples:
  envchain plan
  envchain plan --context staging
  envchain plan --json
`.trim());
}

export function parsePlanArgs(argv: string[]): {
  context: string;
  cwd: string;
  json: boolean;
  help: boolean;
} {
  const args = { context: "local", cwd: process.cwd(), json: false, help: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--help" || a === "-h") args.help = true;
    else if (a === "--json") args.json = true;
    else if ((a === "--context" || a === "-c") && argv[i + 1]) args.context = argv[++i];
    else if (a === "--cwd" && argv[i + 1]) args.cwd = argv[++i];
  }
  return args;
}

export async function runPlanCli(argv: string[]): Promise<void> {
  const args = parsePlanArgs(argv);

  if (args.help) {
    printUsage();
    return;
  }

  const files = envFileCandidates(args.context, args.cwd);

  const candidates = await Promise.all(
    files.map(async (file) => {
      const result = await readEnvFile(file);
      return {
        file,
        context: args.context,
        map: result.map,
        exists: result.exists,
      };
    })
  );

  const plan = buildPlan(candidates);

  if (args.json) {
    console.log(JSON.stringify(plan, null, 2));
  } else {
    console.log(formatPlan(plan));
  }
}

if (import.meta.main) {
  runPlanCli(process.argv.slice(2)).catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
