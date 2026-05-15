#!/usr/bin/env node
import * as fs from "fs";
import * as path from "path";
import { parseEnvContent } from "./parser";
import { mergeEnvMaps } from "./merger";
import { formatEnvMap } from "./formatter";

type Format = "dotenv" | "export" | "json" | "csv";

function printUsage(): void {
  console.log(`
Usage: envchain merge [options] <file1> <file2> [...fileN]

Merge multiple .env files with cascading priority (last file wins).

Options:
  --format <fmt>   Output format: dotenv (default), export, json, csv
  --output <file>  Write output to file instead of stdout
  --strategy <s>   Conflict strategy: last-wins (default), first-wins, error
  --help           Show this help message

Examples:
  envchain merge .env .env.local
  envchain merge .env .env.staging --format json
  envchain merge .env .env.ci --output merged.env
`.trim());
}

interface MergeArgs {
  files: string[];
  format: Format;
  output: string | null;
  strategy: "last-wins" | "first-wins" | "error";
}

export function parseMergeArgs(argv: string[]): MergeArgs {
  const files: string[] = [];
  let format: Format = "dotenv";
  let output: string | null = null;
  let strategy: "last-wins" | "first-wins" | "error" = "last-wins";

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--format" && argv[i + 1]) {
      format = argv[++i] as Format;
    } else if (arg === "--output" && argv[i + 1]) {
      output = argv[++i];
    } else if (arg === "--strategy" && argv[i + 1]) {
      strategy = argv[++i] as "last-wins" | "first-wins" | "error";
    } else if (!arg.startsWith("--")) {
      files.push(arg);
    }
  }

  return { files, format, output, strategy };
}

export function runMergeCli(argv: string[]): void {
  if (argv.includes("--help") || argv.length === 0) {
    printUsage();
    return;
  }

  const { files, format, output, strategy } = parseMergeArgs(argv);

  if (files.length < 2) {
    console.error("Error: at least two files are required for merging.");
    process.exit(1);
  }

  const maps = files.map((f) => {
    const abs = path.resolve(f);
    if (!fs.existsSync(abs)) {
      console.error(`Error: file not found: ${f}`);
      process.exit(1);
    }
    return parseEnvContent(fs.readFileSync(abs, "utf8"));
  });

  const ordered = strategy === "first-wins" ? [...maps].reverse() : maps;
  const merged = ordered.reduce((acc, m) => mergeEnvMaps(acc, m));

  const result = formatEnvMap(merged, format);

  if (output) {
    fs.writeFileSync(path.resolve(output), result, "utf8");
    console.error(`Merged ${files.length} files -> ${output}`);
  } else {
    process.stdout.write(result);
  }
}

if (require.main === module) {
  runMergeCli(process.argv.slice(2));
}
