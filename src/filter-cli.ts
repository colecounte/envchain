#!/usr/bin/env node
/**
 * CLI interface for filtering environment variables by pattern, prefix, or emptiness.
 * Reads from a .env file (or stdin) and outputs filtered results.
 */

import * as fs from "fs";
import * as path from "path";
import { parseEnvContent } from "./parser";
import { filterEnvMap, filterNonEmpty, filterByPrefix } from "./filter";
import { formatEnvMap } from "./formatter";

export function printUsage(): void {
  console.log(`
envchaain filter — Filter environment variables by pattern, prefix, or emptiness

Usage:
  envchain filter [options] [file]

Options:
  --pattern <glob>     Keep keys matching glob pattern (e.g. "DB_*")
  --prefix <prefix>    Keep keys with the given prefix
  --non-empty          Exclude keys with empty values
  --invert             Invert the filter (exclude matches instead of keeping them)
  --format <fmt>       Output format: dotenv (default), export, json, csv
  --help               Show this help message

Examples:
  envchain filter --prefix DB_ .env.local
  envchain filter --pattern "*_SECRET" --invert .env
  envchain filter --non-empty --format json .env.staging
  cat .env | envchain filter --prefix APP_
`);
}

export interface FilterArgs {
  file?: string;
  pattern?: string;
  prefix?: string;
  nonEmpty: boolean;
  invert: boolean;
  format: string;
  help: boolean;
}

export function parseFilterArgs(argv: string[]): FilterArgs {
  const args: FilterArgs = {
    nonEmpty: false,
    invert: false,
    format: "dotenv",
    help: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      args.help = true;
    } else if (arg === "--pattern" && argv[i + 1]) {
      args.pattern = argv[++i];
    } else if (arg === "--prefix" && argv[i + 1]) {
      args.prefix = argv[++i];
    } else if (arg === "--non-empty") {
      args.nonEmpty = true;
    } else if (arg === "--invert") {
      args.invert = true;
    } else if (arg === "--format" && argv[i + 1]) {
      args.format = argv[++i];
    } else if (!arg.startsWith("--")) {
      args.file = arg;
    }
  }

  return args;
}

export async function runFilterCli(argv: string[]): Promise<void> {
  const args = parseFilterArgs(argv);

  if (args.help) {
    printUsage();
    return;
  }

  let raw: string;
  if (args.file) {
    const filePath = path.resolve(process.cwd(), args.file);
    if (!fs.existsSync(filePath)) {
      console.error(`Error: file not found: ${args.file}`);
      process.exit(1);
    }
    raw = fs.readFileSync(filePath, "utf8");
  } else if (!process.stdin.isTTY) {
    raw = fs.readFileSync("/dev/stdin", "utf8");
  } else {
    console.error("Error: no input file provided and stdin is empty.");
    printUsage();
    process.exit(1);
  }

  let envMap = parseEnvContent(raw);

  if (args.nonEmpty) {
    envMap = filterNonEmpty(envMap);
  }

  if (args.prefix) {
    const result = filterByPrefix(envMap, args.prefix);
    envMap = args.invert
      ? filterEnvMap(envMap, (k) => !k.startsWith(args.prefix!))
      : result;
  } else if (args.pattern) {
    envMap = filterEnvMap(envMap, args.pattern, args.invert);
  }

  const output = formatEnvMap(envMap, args.format as any);
  process.stdout.write(output + "\n");
}

// Run if called directly
if (require.main === module) {
  runFilterCli(process.argv.slice(2)).catch((err) => {
    console.error("Unexpected error:", err);
    process.exit(1);
  });
}
