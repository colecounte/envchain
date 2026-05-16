/**
 * aliaser-cli.ts — CLI interface for the aliaser module
 *
 * Usage:
 *   envchain alias --alias ALIAS=ORIGINAL [--remove-original] [--dry-run]
 */

import { parseAliasArgs, applyAliases, formatAliasSummary } from "./aliaser";
import { parseEnvContent } from "./parser";
import { formatDotenv } from "./formatter";
import * as fs from "fs";

export function printUsage(): void {
  console.log(`
envchain alias — Apply key aliases to an env map

Usage:
  envchain alias [options] <file>

Options:
  --alias ALIAS=ORIGINAL   Map ALIAS to the value of ORIGINAL (repeatable)
  --remove-original        Remove the original key after aliasing
  --dry-run                Print summary without writing output
  --help                   Show this help

Example:
  envchain alias --alias DB_URL=DATABASE_URL --alias SVC_PORT=APP_PORT .env
`);
}

export function parseAliasCliArgs(argv: string[]): {
  file: string;
  aliasDefs: string[];
  removeOriginal: boolean;
  dryRun: boolean;
} {
  const aliasDefs: string[] = [];
  let file = "";
  let removeOriginal = false;
  let dryRun = false;

  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--alias" && argv[i + 1]) {
      aliasDefs.push(argv[++i]);
    } else if (argv[i] === "--remove-original") {
      removeOriginal = true;
    } else if (argv[i] === "--dry-run") {
      dryRun = true;
    } else if (!argv[i].startsWith("--")) {
      file = argv[i];
    }
  }
  return { file, aliasDefs, removeOriginal, dryRun };
}

export function runAliasCli(argv: string[]): void {
  if (argv.includes("--help") || argv.length === 0) {
    printUsage();
    return;
  }

  const { file, aliasDefs, removeOriginal, dryRun } = parseAliasCliArgs(argv);

  if (!file) {
    console.error("Error: no input file specified.");
    process.exit(1);
  }

  const raw = fs.readFileSync(file, "utf-8");
  const env = parseEnvContent(raw);
  const aliases = parseAliasArgs(aliasDefs);
  const result = applyAliases(env, aliases, removeOriginal);

  const summary = formatAliasSummary(env, aliases);
  console.error(`Alias summary:\n${summary}`);

  if (!dryRun) {
    console.log(formatDotenv(result));
  }
}
