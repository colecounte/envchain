import * as fs from "fs";
import * as path from "path";

export interface ArchiveEntry {
  filename: string;
  context: string;
  createdAt: string;
  keys: string[];
}

export interface ArchiveIndex {
  entries: ArchiveEntry[];
}

export function archiveDir(baseDir: string): string {
  return path.join(baseDir, ".envchain", "archive");
}

export function archiveEnvMap(
  map: Record<string, string>,
  context: string,
  baseDir: string
): string {
  const dir = archiveDir(baseDir);
  fs.mkdirSync(dir, { recursive: true });

  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `${context}-${ts}.env`;
  const filePath = path.join(dir, filename);

  const lines = Object.entries(map)
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");
  fs.writeFileSync(filePath, lines, "utf8");

  updateArchiveIndex(baseDir, {
    filename,
    context,
    createdAt: new Date().toISOString(),
    keys: Object.keys(map),
  });

  return filePath;
}

export function updateArchiveIndex(baseDir: string, entry: ArchiveEntry): void {
  const dir = archiveDir(baseDir);
  const indexPath = path.join(dir, "index.json");
  let index: ArchiveIndex = { entries: [] };
  if (fs.existsSync(indexPath)) {
    index = JSON.parse(fs.readFileSync(indexPath, "utf8"));
  }
  index.entries.push(entry);
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2), "utf8");
}

export function loadArchiveIndex(baseDir: string): ArchiveIndex {
  const indexPath = path.join(archiveDir(baseDir), "index.json");
  if (!fs.existsSync(indexPath)) return { entries: [] };
  return JSON.parse(fs.readFileSync(indexPath, "utf8"));
}

export function listArchives(baseDir: string, context?: string): ArchiveEntry[] {
  const index = loadArchiveIndex(baseDir);
  if (!context) return index.entries;
  return index.entries.filter((e) => e.context === context);
}

export function readArchive(
  baseDir: string,
  filename: string
): Record<string, string> {
  const filePath = path.join(archiveDir(baseDir), filename);
  if (!fs.existsSync(filePath)) throw new Error(`Archive not found: ${filename}`);
  const content = fs.readFileSync(filePath, "utf8");
  const result: Record<string, string> = {};
  for (const line of content.split("\n")) {
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    result[line.slice(0, eq)] = line.slice(eq + 1);
  }
  return result;
}
