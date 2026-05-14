import * as fs from "fs";
import * as path from "path";

export interface EnvSnapshot {
  context: string;
  timestamp: string;
  vars: Record<string, string>;
}

export function createSnapshot(
  context: string,
  vars: Record<string, string>
): EnvSnapshot {
  return {
    context,
    timestamp: new Date().toISOString(),
    vars: { ...vars },
  };
}

export function saveSnapshot(
  snapshot: EnvSnapshot,
  dir: string
): string {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const filename = `${snapshot.context}-${snapshot.timestamp.replace(/[:.]/g, "-")}.json`;
  const filepath = path.join(dir, filename);
  fs.writeFileSync(filepath, JSON.stringify(snapshot, null, 2), "utf-8");
  return filepath;
}

export function loadSnapshot(filepath: string): EnvSnapshot {
  const raw = fs.readFileSync(filepath, "utf-8");
  const parsed = JSON.parse(raw);
  if (!parsed.context || !parsed.timestamp || !parsed.vars) {
    throw new Error(`Invalid snapshot file: ${filepath}`);
  }
  return parsed as EnvSnapshot;
}

export function listSnapshots(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => path.join(dir, f))
    .sort();
}

export function diffSnapshots(
  a: EnvSnapshot,
  b: EnvSnapshot
): { added: Record<string, string>; removed: Record<string, string>; changed: Record<string, [string, string]> } {
  const added: Record<string, string> = {};
  const removed: Record<string, string> = {};
  const changed: Record<string, [string, string]> = {};

  for (const key of Object.keys(b.vars)) {
    if (!(key in a.vars)) added[key] = b.vars[key];
    else if (a.vars[key] !== b.vars[key]) changed[key] = [a.vars[key], b.vars[key]];
  }
  for (const key of Object.keys(a.vars)) {
    if (!(key in b.vars)) removed[key] = a.vars[key];
  }
  return { added, removed, changed };
}
