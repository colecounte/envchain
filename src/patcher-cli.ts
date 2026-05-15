/**
 * patcher-cli.ts — CLI entry point for applying patches to a resolved env map.
 */

import { resolveEnv } from "./resolver";
import { applyPatches, parsePatchArgs, formatPatchSummary } from "./patcher";
import { formatEnvMap } from "./formatter";

function printUsage(): void {
  console.log(`
envchaing patch — apply key-value patches to the resolved env

Usage:
  envchain patch [options] -- <command>

Options:
  --context=<ctx>        Context to resolve (default: local)
  --set=KEY=VALUE        Set a key to a value
  --unset=KEY            Remove a key
  --rename=OLD:NEW       Rename a key
  --format=<fmt>         Output format: dotenv | export | json | csv (default: dotenv)
  --dry-run              Print summary without outputting the patched map
  --help                 Show this help
`.trim());
}

export async function runPatchCli(argv: string[]): Promise<void> {
  if (argv.includes("--help")) {
    printUsage();
    return;
  }

  const contextArg = argv.find((a) => a.startsWith("--context="));
  const context = contextArg ? contextArg.slice(10) : "local";

  const formatArg = argv.find((a) => a.startsWith("--format="));
  const format = (formatArg ? formatArg.slice(9) : "dotenv") as
    | "dotenv"
    | "export"
    | "json"
    | "csv";

  const dryRun = argv.includes("--dry-run");

  const patchArgs = argv.filter(
    (a) => a.startsWith("--set=") || a.startsWith("--unset=") || a.startsWith("--rename=")
  );

  let ops;
  try {
    ops = parsePatchArgs(patchArgs);
  } catch (err: any) {
    console.error(`[envchain patch] ${err.message}`);
    process.exit(1);
  }

  if (ops.length === 0) {
    console.error("[envchain patch] No patch operations specified. Use --set, --unset, or --rename.");
    process.exit(1);
  }

  const base = await resolveEnv(process.cwd(), context);
  const result = applyPatches(base, ops);

  if (dryRun) {
    console.log(formatPatchSummary(result));
    return;
  }

  const output = formatEnvMap(result.map, format);
  process.stdout.write(output + "\n");
}

if (require.main === module) {
  runPatchCli(process.argv.slice(2)).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
