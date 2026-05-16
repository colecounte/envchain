import { readFileSync } from "fs";
import { parseEnvContent } from "./parser";
import { fieldsFromKeys, promptEnvMap, mergePromptResult } from "./prompter";
import { formatDotenv } from "./formatter";

function printUsage() {
  console.log(`
envchaim prompt — interactively fill missing env values

Usage:
  envchain prompt [options] [keys...]

Options:
  --from <file>     Load existing .env file as base
  --only-missing    Only prompt for keys not set in base
  --out <file>      Write result to file (default: stdout)
  --help            Show this help

Examples:
  envchain prompt DB_HOST DB_PASSWORD
  envchain prompt --from .env --only-missing DB_TOKEN
`.trim());
}

export async function runPromptCli(argv: string[]): Promise<void> {
  const args = argv.slice(2);
  if (args.includes("--help")) {
    printUsage();
    return;
  }

  let fromFile: string | undefined;
  let onlyMissing = false;
  let outFile: string | undefined;
  const keys: string[] = [];

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--from" && args[i + 1]) {
      fromFile = args[++i];
    } else if (args[i] === "--out" && args[i + 1]) {
      outFile = args[++i];
    } else if (args[i] === "--only-missing") {
      onlyMissing = true;
    } else if (!args[i].startsWith("--")) {
      keys.push(args[i]);
    }
  }

  let base: Map<string, string> = new Map();
  if (fromFile) {
    try {
      const content = readFileSync(fromFile, "utf-8");
      base = parseEnvContent(content);
    } catch {
      console.error(`Error: could not read file '${fromFile}'`);
      process.exit(1);
    }
  }

  const targetKeys =
    keys.length > 0
      ? keys
      : Array.from(base.keys());

  const promptKeys = onlyMissing
    ? targetKeys.filter((k) => !base.has(k) || base.get(k) === "")
    : targetKeys;

  if (promptKeys.length === 0) {
    console.error("No keys to prompt for.");
    process.exit(0);
  }

  const fields = fieldsFromKeys(promptKeys);
  const prompted = await promptEnvMap(fields);
  const merged = mergePromptResult(base, prompted);
  const output = formatDotenv(merged);

  if (outFile) {
    const { writeFileSync } = await import("fs");
    writeFileSync(outFile, output, "utf-8");
    console.error(`Written to ${outFile}`);
  } else {
    process.stdout.write(output);
  }
}
