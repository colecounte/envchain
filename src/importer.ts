import * as fs from "fs";
import * as path from "path";
import { parseEnvContent } from "./parser";
import { EnvMap } from "./merger";

export type ImportFormat = "dotenv" | "json" | "csv" | "export";

export function inferImportFormat(filePath: string): ImportFormat {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".json") return "json";
  if (ext === ".csv") return "csv";
  if (ext === ".sh" || ext === ".bash") return "export";
  return "dotenv";
}

export function importFromDotenv(content: string): EnvMap {
  return parseEnvContent(content);
}

export function importFromJson(content: string): EnvMap {
  const parsed = JSON.parse(content);
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error("JSON import must be a flat key-value object");
  }
  const map: EnvMap = new Map();
  for (const [key, value] of Object.entries(parsed)) {
    if (typeof value !== "string") {
      throw new Error(`JSON import: value for key "${key}" must be a string`);
    }
    map.set(key, value);
  }
  return map;
}

export function importFromCsv(content: string): EnvMap {
  const map: EnvMap = new Map();
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const commaIdx = trimmed.indexOf(",");
    if (commaIdx === -1) continue;
    const key = trimmed.slice(0, commaIdx).trim();
    const value = trimmed.slice(commaIdx + 1).trim().replace(/^"|"$/g, "");
    if (key) map.set(key, value);
  }
  return map;
}

export function importFromExport(content: string): EnvMap {
  const map: EnvMap = new Map();
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const withoutExport = trimmed.replace(/^export\s+/, "");
    const eqIdx = withoutExport.indexOf("=");
    if (eqIdx === -1) continue;
    const key = withoutExport.slice(0, eqIdx).trim();
    const value = withoutExport.slice(eqIdx + 1).trim().replace(/^"|"$/g, "").replace(/^'|'$/g, "");
    if (key) map.set(key, value);
  }
  return map;
}

export function importEnvMap(content: string, format: ImportFormat): EnvMap {
  switch (format) {
    case "json": return importFromJson(content);
    case "csv": return importFromCsv(content);
    case "export": return importFromExport(content);
    default: return importFromDotenv(content);
  }
}

export function importEnvFile(filePath: string, format?: ImportFormat): EnvMap {
  const content = fs.readFileSync(filePath, "utf8");
  const fmt = format ?? inferImportFormat(filePath);
  return importEnvMap(content, fmt);
}
