import { readFileSync } from "fs";
import { parseEnvContent } from "./parser";
import {
  deduplicateEnvMaps,
  formatDuplicates,
  DedupeStrategy,
} from "./deduplicator";
import { formatEnvMap } from "./formatter";

export function printUsage(): void {
  console.log(`
envchai dedupe — Remove duplicate keys across .env files

Usage:
  envchain dedupe [options] <file1> <file2> [...]

Options:
  --strategy <last-wins|first-wins|error>  Conflict resolution (default: last-wins)
  --format   <dotenv|export|json|csv>      Output format (default: dotenv)
  --show-duplicates                        Print duplicate report to stderr
  --help                                   Show this help
`.trim());
}

export function parseDedupeArgs(argv: string[]): {
  files: string[];
  strategy: DedupeStrategy;
  format: string;
  showDuplicates: boolean;
  help: boolean;
} {
  const files: string[] = [];
  let strategy: DedupeStrategy = "last-wins";
  let format = "dotenv";
  let showDuplicates = false;
  let help = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help") help = true;
    else if (arg === "--show-duplicates") showDuplicates = true;
    else if (arg === "--strategy") strategy = argv[++i] as DedupeStrategy;
    else if (arg === "--format") format = argv[++i];
    else if (!arg.startsWith("--")) files.push(arg);
  }

  return { files, strategy, format, showDuplicates, help };
}

export function runDedupeCli(argv: string[]): void {
  const opts = parseDedupeArgs(argv);

  if (opts.help || opts.files.length === 0) {
    printUsage();
    process.exit(opts.help ? 0 : 1);
  }

  const maps = opts.files.map((f) => ({
    label: f,
    env: parseEnvContent(readFileSync(f, "utf8")),
  }));

  let result;
  try {
    result = deduplicateEnvMaps(maps, opts.strategy);
  } catch (err: unknown) {
    console.error(`Error: ${(err as Error).message}`);
    process.exit(1);
  }

  if (opts.showDuplicates && result.duplicates.length > 0) {
    console.error("Duplicates found:\n" + formatDuplicates(result.duplicates));
  }

  console.log(formatEnvMap(result.env, opts.format as never));
}
