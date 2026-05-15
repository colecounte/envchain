/**
 * tagger-cli.ts — CLI interface for tagging env keys
 */

import { parseEnvContent } from "./parser";
import {
  createTagMap,
  addTag,
  removeTag,
  filterByTag,
  tagMapToRecord,
  Tag,
} from "./tagger";
import * as fs from "fs";

export function printUsage(): void {
  console.log(`Usage: envchain tag <file> [options]

Options:
  --add <key> <tag>     Add a tag to a key
  --remove <key> <tag>  Remove a tag from a key
  --filter <tag>        Print only keys with given tag
  --list                List all tagged keys as JSON
  --help                Show this help message

Built-in tags: secret, required, deprecated, readonly
`);
}

export interface TagArgs {
  file: string;
  adds: Array<{ key: string; tag: Tag }>;
  removes: Array<{ key: string; tag: Tag }>;
  filter?: Tag;
  list: boolean;
}

export function parseTagArgs(argv: string[]): TagArgs | null {
  const args = argv.slice(2);
  if (args.length === 0 || args.includes("--help")) {
    printUsage();
    return null;
  }
  const file = args[0];
  const adds: TagArgs["adds"] = [];
  const removes: TagArgs["removes"] = [];
  let filter: Tag | undefined;
  let list = false;

  for (let i = 1; i < args.length; i++) {
    if (args[i] === "--add" && args[i + 1] && args[i + 2]) {
      adds.push({ key: args[i + 1], tag: args[i + 2] });
      i += 2;
    } else if (args[i] === "--remove" && args[i + 1] && args[i + 2]) {
      removes.push({ key: args[i + 1], tag: args[i + 2] });
      i += 2;
    } else if (args[i] === "--filter" && args[i + 1]) {
      filter = args[i + 1];
      i++;
    } else if (args[i] === "--list") {
      list = true;
    }
  }
  return { file, adds, removes, filter, list };
}

export function runTagCli(argv: string[]): void {
  const args = parseTagArgs(argv);
  if (!args) return;

  const raw = fs.readFileSync(args.file, "utf-8");
  const envMap = parseEnvContent(raw);
  let tagMap = createTagMap();

  for (const { key, tag } of args.adds) tagMap = addTag(tagMap, key, tag);
  for (const { key, tag } of args.removes) tagMap = removeTag(tagMap, key, tag);

  if (args.filter) {
    const filtered = filterByTag(envMap, tagMap, args.filter);
    for (const [key, value] of filtered) console.log(`${key}=${value}`);
  } else if (args.list) {
    console.log(JSON.stringify(tagMapToRecord(tagMap), null, 2));
  } else {
    printUsage();
  }
}
