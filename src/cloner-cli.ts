import { cloneEnvMap, formatCloneResult, CloneOptions } from "./cloner";
import { parseEnvContent } from "./parser";
import { readFileSync } from "fs";

function printUsage(): void {
  console.log(`
envcli clone — Clone keys from one env map into another

Usage:
  envchain clone <source> [target] [options]

Options:
  --prefix <str>     Prefix to add to cloned key names
  --suffix <str>     Suffix to add to cloned key names
  --overwrite        Overwrite existing keys in target
  --keys <k1,k2>     Comma-separated list of keys to clone
  --help             Show this help message
`.trim());
}

export function parseCloneArgs(argv: string[]): {
  sourceFile: string;
  targetFile: string | null;
  options: CloneOptions;
} {
  const args = argv.slice(2);
  const sourceFile = args[0];
  let targetFile: string | null = null;
  const options: CloneOptions = {};

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--prefix") options.prefix = args[++i];
    else if (arg === "--suffix") options.suffix = args[++i];
    else if (arg === "--overwrite") options.overwrite = true;
    else if (arg === "--keys") options.keys = args[++i].split(",").map((k) => k.trim());
    else if (!arg.startsWith("--") && !targetFile) targetFile = arg;
  }

  return { sourceFile, targetFile, options };
}

export function runCloneCli(argv: string[]): void {
  if (argv.includes("--help") || argv.length < 3) {
    printUsage();
    process.exit(0);
  }

  const { sourceFile, targetFile, options } = parseCloneArgs(argv);

  let source: Record<string, string> = {};
  let target: Record<string, string> = {};

  try {
    source = parseEnvContent(readFileSync(sourceFile, "utf-8"));
  } catch {
    console.error(`Error: cannot read source file "${sourceFile}"`);
    process.exit(1);
  }

  if (targetFile) {
    try {
      target = parseEnvContent(readFileSync(targetFile, "utf-8"));
    } catch {
      console.error(`Error: cannot read target file "${targetFile}"`);
      process.exit(1);
    }
  }

  const result = cloneEnvMap(source, target, options);

  for (const [key, value] of Object.entries(result.cloned)) {
    process.stdout.write(`${key}=${value}\n`);
  }

  console.error(formatCloneResult(result));
}
