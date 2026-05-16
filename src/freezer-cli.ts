/**
 * freezer-cli.ts — CLI interface for freezing env maps and detecting drift.
 */

import { readFileSync } from "fs";
import { parseEnvContent } from "./parser";
import {
  freezeEnvMap,
  createFreezeRecord,
  detectDrift,
  formatDrift,
  hasDrift,
} from "./freezer";

export function printUsage(): void {
  console.log(`
envchai freezer — Freeze env maps and detect drift

Usage:
  envchain freeze <file> [--context <ctx>]   Freeze an env file
  envchain drift <frozen.json> <current>     Detect drift from frozen snapshot

Options:
  --context   Context label (default: "default")
  --strict    Exit with code 1 if drift detected
  --help      Show this help
`.trim());
}

export function runFreezeCli(args: string[]): void {
  if (args.includes("--help") || args.length === 0) {
    printUsage();
    return;
  }

  const command = args[0];

  if (command === "freeze") {
    const file = args[1];
    if (!file) {
      console.error("Error: missing file argument");
      process.exit(1);
    }
    const ctxIdx = args.indexOf("--context");
    const context = ctxIdx !== -1 ? args[ctxIdx + 1] : "default";
    const content = readFileSync(file, "utf-8");
    const map = parseEnvContent(content);
    const record = createFreezeRecord(map, context);
    console.log(JSON.stringify(record, null, 2));
    return;
  }

  if (command === "drift") {
    const frozenFile = args[1];
    const currentFile = args[2];
    if (!frozenFile || !currentFile) {
      console.error("Error: drift requires <frozen.json> and <current> arguments");
      process.exit(1);
    }
    const strict = args.includes("--strict");
    const record = JSON.parse(readFileSync(frozenFile, "utf-8"));
    const currentContent = readFileSync(currentFile, "utf-8");
    const current = parseEnvContent(currentContent);
    const drift = detectDrift(record.map, current);
    if (!hasDrift(record.map, current)) {
      console.log("No drift detected.");
      return;
    }
    console.log("Drift detected:\n");
    console.log(formatDrift(drift));
    if (strict) process.exit(1);
    return;
  }

  console.error(`Unknown command: ${command}`);
  printUsage();
  process.exit(1);
}
