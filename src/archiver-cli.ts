import * as path from "path";
import { archiveEnvMap, listArchives, readArchive } from "./archiver";
import { parseEnvContent } from "./parser";
import * as fs from "fs";

export function printUsage(): void {
  console.log(`
envchai archive — archive and restore env snapshots

Usage:
  envchain archive save <file> [--context <ctx>] [--dir <dir>]
  envchain archive list [--context <ctx>] [--dir <dir>]
  envchain archive restore <filename> [--dir <dir>]

Options:
  --context  Context label (default: local)
  --dir      Base directory for archive storage (default: cwd)
`.trim());
}

export function parseArchiveArgs(argv: string[]): {
  command: string;
  file?: string;
  context: string;
  dir: string;
  filename?: string;
} {
  const args = argv.slice(2);
  const command = args[0] ?? "list";
  let file: string | undefined;
  let filename: string | undefined;
  let context = "local";
  let dir = process.cwd();

  for (let i = 1; i < args.length; i++) {
    if (args[i] === "--context" && args[i + 1]) context = args[++i];
    else if (args[i] === "--dir" && args[i + 1]) dir = args[++i];
    else if (command === "save" && !file) file = args[i];
    else if (command === "restore" && !filename) filename = args[i];
  }

  return { command, file, context, dir, filename };
}

export async function runArchiveCli(argv: string[]): Promise<void> {
  const { command, file, context, dir, filename } = parseArchiveArgs(argv);

  if (command === "save") {
    if (!file) {
      console.error("Error: file argument required for save");
      process.exit(1);
    }
    const content = fs.readFileSync(path.resolve(file), "utf8");
    const map = parseEnvContent(content);
    const saved = archiveEnvMap(map, context, dir);
    console.log(`Archived ${Object.keys(map).length} keys → ${saved}`);
  } else if (command === "list") {
    const entries = listArchives(dir, context || undefined);
    if (entries.length === 0) {
      console.log("No archives found.");
      return;
    }
    for (const e of entries) {
      console.log(`${e.filename}  context=${e.context}  keys=${e.keys.length}  created=${e.createdAt}`);
    }
  } else if (command === "restore") {
    if (!filename) {
      console.error("Error: filename argument required for restore");
      process.exit(1);
    }
    const map = readArchive(dir, filename);
    for (const [k, v] of Object.entries(map)) {
      console.log(`${k}=${v}`);
    }
  } else {
    printUsage();
  }
}
