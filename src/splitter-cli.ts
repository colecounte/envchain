/**
 * splitter-cli.ts — CLI interface for the splitter module
 */

import { splitByPrefix, splitByPattern, formatSplitResult, EnvMap } from "./splitter";
import { parseEnvContent } from "./parser";
import { readFileSync } from "fs";

export function printUsage(): void {
  console.log(`
envchainsplit — Split env vars by prefix or pattern

Usage:
  envchain split --file <file> --prefix DB,APP [options]
  envchain split --file <file> --pattern secrets=^SECRET_,net=^(PORT|HOST)$

Options:
  --file <path>       Path to .env file (required)
  --prefix <a,b,...>  Comma-separated prefixes to split by
  --pattern <n=re,...> Named regex patterns (name=regex,...)
  --help              Show this help
`.trim());
}

export function parseSplitArgs(argv: string[]): {
  file?: string;
  prefixes?: string[];
  patterns?: Record<string, RegExp>;
} {
  const args: { file?: string; prefixes?: string[]; patterns?: Record<string, RegExp> } = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--file" && argv[i + 1]) {
      args.file = argv[++i];
    } else if (argv[i] === "--prefix" && argv[i + 1]) {
      args.prefixes = argv[++i].split(",").map((s) => s.trim());
    } else if (argv[i] === "--pattern" && argv[i + 1]) {
      args.patterns = {};
      for (const entry of argv[++i].split(",")) {
        const eq = entry.indexOf("=");
        if (eq !== -1) {
          const name = entry.slice(0, eq);
          const re = entry.slice(eq + 1);
          args.patterns[name] = new RegExp(re);
        }
      }
    }
  }
  return args;
}

export function runSplitCli(argv: string[]): void {
  if (argv.includes("--help")) {
    printUsage();
    return;
  }

  const args = parseSplitArgs(argv);

  if (!args.file) {
    console.error("Error: --file is required");
    process.exit(1);
  }

  let content: string;
  try {
    content = readFileSync(args.file, "utf-8");
  } catch {
    console.error(`Error: cannot read file '${args.file}'`);
    process.exit(1);
  }

  const env: EnvMap = parseEnvContent(content);

  if (args.prefixes) {
    const result = splitByPrefix(env, args.prefixes);
    console.log(formatSplitResult(result));
  } else if (args.patterns) {
    const result = splitByPattern(env, args.patterns);
    console.log(formatSplitResult(result));
  } else {
    console.error("Error: specify --prefix or --pattern");
    process.exit(1);
  }
}
