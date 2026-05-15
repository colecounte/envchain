/**
 * transformer-cli.ts — CLI interface for applying transforms to env files
 */

import { readFileSync } from "fs";
import { parseEnvContent } from "./parser";
import { formatEnvMap } from "./formatter";
import {
  transformEnvMap,
  resolveTransformFn,
  TransformRule,
} from "./transformer";

export function printUsage(): void {
  console.log(`
Usage: envchain transform [options]

Options:
  --input <file>         Input .env file (default: stdin)
  --rule <key>=<fn>      Apply transform fn to key/prefix (repeatable)
  --format <fmt>         Output format: dotenv|export|json|csv (default: dotenv)
  --list                 List available transform functions
  --help                 Show this help

Available transforms: upper, lower, trim, base64encode, base64decode, json

Examples:
  envchain transform --input .env --rule DB_=upper
  envchain transform --input .env --rule SECRET_KEY=base64encode --format json
`.trim());
}

export function parseTransformArgs(argv: string[]): {
  input?: string;
  rules: Array<{ pattern: string; fn: string }>;
  format: string;
  list: boolean;
  help: boolean;
} {
  const result = { input: undefined as string | undefined, rules: [] as Array<{ pattern: string; fn: string }>, format: "dotenv", list: false, help: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help") result.help = true;
    else if (arg === "--list") result.list = true;
    else if (arg === "--input") result.input = argv[++i];
    else if (arg === "--format") result.format = argv[++i];
    else if (arg === "--rule") {
      const raw = argv[++i] ?? "";
      const eq = raw.indexOf("=");
      if (eq !== -1) result.rules.push({ pattern: raw.slice(0, eq), fn: raw.slice(eq + 1) });
    }
  }
  return result;
}

export function runTransformCli(argv: string[]): void {
  const opts = parseTransformArgs(argv);
  if (opts.help) { printUsage(); return; }
  if (opts.list) {
    console.log("Available transforms: upper, lower, trim, base64encode, base64decode, json");
    return;
  }

  const raw = opts.input ? readFileSync(opts.input, "utf8") : "";
  let map = parseEnvContent(raw);

  const rules: TransformRule[] = [];
  for (const { pattern, fn } of opts.rules) {
    const transformFn = resolveTransformFn(fn);
    if (!transformFn) { console.error(`Unknown transform: ${fn}`); process.exit(1); }
    rules.push({ pattern, transform: transformFn });
  }

  map = transformEnvMap(map, rules);
  console.log(formatEnvMap(map, opts.format as "dotenv" | "export" | "json" | "csv"));
}
