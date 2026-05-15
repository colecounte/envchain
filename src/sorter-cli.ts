#!/usr/bin/env node
/**
 * sorter-cli.ts — CLI interface for sorting/grouping env output
 */

import { sortEnvMap, groupEnvByPrefix, SortOrder } from "./sorter";
import { parseEnvContent } from "./parser";
import { formatDotenv } from "./formatter";
import * as fs from "fs";

function printUsage(): void {
  console.log(`Usage: envchain-sort [options] <file>

Options:
  --order <asc|desc>   Sort order (default: asc)
  --group              Group keys by prefix
  --delimiter <char>   Prefix delimiter (default: _)
  --help               Show this help
`);
}

export function runSortCli(argv: string[] = process.argv.slice(2)): void {
  if (argv.includes("--help") || argv.length === 0) {
    printUsage();
    return;
  }

  const file = argv.find((a) => !a.startsWith("--") && argv[argv.indexOf(a) - 1] !== "--order" && argv[argv.indexOf(a) - 1] !== "--delimiter");
  if (!file) {
    console.error("Error: no input file specified.");
    process.exit(1);
  }

  let content: string;
  try {
    content = fs.readFileSync(file, "utf-8");
  } catch {
    console.error(`Error: cannot read file '${file}'`);
    process.exit(1);
  }

  const orderIdx = argv.indexOf("--order");
  const order: SortOrder = orderIdx !== -1 && argv[orderIdx + 1] === "desc" ? "desc" : "asc";

  const delimIdx = argv.indexOf("--delimiter");
  const delimiter = delimIdx !== -1 ? argv[delimIdx + 1] : "_";

  const group = argv.includes("--group");

  const env = parseEnvContent(content);
  const sorted = sortEnvMap(env, order);

  if (group) {
    const groups = groupEnvByPrefix(sorted, delimiter);
    for (const [prefix, map] of groups) {
      console.log(`# --- ${prefix} ---`);
      process.stdout.write(formatDotenv(map));
    }
  } else {
    process.stdout.write(formatDotenv(sorted));
  }
}

if (require.main === module) {
  runSortCli();
}
