/**
 * pinner-cli.ts — CLI interface for managing pinned env keys.
 *
 * Usage:
 *   envchain pin add KEY=VALUE [--file <path>]
 *   envchain pin remove KEY [--file <path>]
 *   envchain pin list [--file <path>]
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import {
  addPin,
  removePin,
  listPins,
  formatPinSummary,
  type PinRecord,
} from "./pinner";

const DEFAULT_PIN_FILE = ".envchain-pins.json";

export function printUsage(): void {
  console.log(`Usage: envchain pin <add|remove|list> [options]

Commands:
  add KEY=VALUE    Pin a key to a fixed value
  remove KEY       Unpin a key
  list             List all pinned keys

Options:
  --file <path>    Path to pin file (default: ${DEFAULT_PIN_FILE})
  --help           Show this help message`);
}

function loadPinFile(filePath: string): PinRecord {
  if (!existsSync(filePath)) return {};
  try {
    return JSON.parse(readFileSync(filePath, "utf-8")) as PinRecord;
  } catch {
    return {};
  }
}

function savePinFile(filePath: string, record: PinRecord): void {
  writeFileSync(filePath, JSON.stringify(record, null, 2) + "\n", "utf-8");
}

export function runPinCli(argv: string[]): void {
  const args = argv.slice(2);

  if (args.includes("--help") || args.length === 0) {
    printUsage();
    return;
  }

  const fileIdx = args.indexOf("--file");
  const pinFile =
    fileIdx !== -1 && args[fileIdx + 1] ? args[fileIdx + 1] : DEFAULT_PIN_FILE;

  const filtered = args.filter(
    (a, i) => a !== "--file" && args[i - 1] !== "--file"
  );

  const [command, operand] = filtered;

  const record = loadPinFile(pinFile);

  if (command === "add") {
    if (!operand || !operand.includes("=")) {
      console.error("Error: add requires KEY=VALUE");
      process.exit(1);
    }
    const eqIdx = operand.indexOf("=");
    const key = operand.slice(0, eqIdx);
    const value = operand.slice(eqIdx + 1);
    const updated = addPin(record, key, value);
    savePinFile(pinFile, updated);
    console.log(`Pinned ${key}=${value}`);
  } else if (command === "remove") {
    if (!operand) {
      console.error("Error: remove requires KEY");
      process.exit(1);
    }
    const updated = removePin(record, operand);
    savePinFile(pinFile, updated);
    console.log(`Unpinned ${operand}`);
  } else if (command === "list") {
    const entries = listPins(record);
    if (entries.length === 0) {
      console.log("No pinned keys.");
    } else {
      console.log(formatPinSummary(record));
    }
  } else {
    console.error(`Unknown command: ${command}`);
    printUsage();
    process.exit(1);
  }
}
