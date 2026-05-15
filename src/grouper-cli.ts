import { groupByPrefix, groupByPattern, formatGroups } from "./grouper";
import { parseEnvContent } from "./parser";
import * as fs from "fs";

export function printUsage(): void {
  console.log(`
envcain group — Group environment variables by prefix or pattern

Usage:
  envchain group [options] <file>

Options:
  --separator <char>    Prefix separator (default: _)
  --pattern <label=regex> Group by named pattern (repeatable)
  --help                Show this help

Examples:
  envchain group .env
  envchain group --separator . .env
  envchain group --pattern db=^DB_ --pattern aws=^AWS_ .env
`.trim());
}

export function parseGroupArgs(argv: string[]): {
  file: string;
  separator: string;
  patterns: Record<string, RegExp>;
  help: boolean;
} {
  let file = "";
  let separator = "_";
  const patterns: Record<string, RegExp> = {};
  let help = false;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--help") { help = true; }
    else if (argv[i] === "--separator") { separator = argv[++i]; }
    else if (argv[i] === "--pattern") {
      const raw = argv[++i];
      const eq = raw.indexOf("=");
      if (eq !== -1) {
        patterns[raw.slice(0, eq)] = new RegExp(raw.slice(eq + 1));
      }
    } else {
      file = argv[i];
    }
  }
  return { file, separator, patterns, help };
}

export function runGroupCli(argv: string[]): void {
  const opts = parseGroupArgs(argv);
  if (opts.help || !opts.file) { printUsage(); return; }
  const content = fs.readFileSync(opts.file, "utf8");
  const env = parseEnvContent(content);
  const groups =
    Object.keys(opts.patterns).length > 0
      ? groupByPattern(env, opts.patterns)
      : groupByPrefix(env, opts.separator);
  console.log(formatGroups(groups));
}
