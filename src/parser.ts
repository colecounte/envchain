import * as fs from 'fs';
import * as path from 'path';

export interface EnvEntry {
  key: string;
  value: string;
  source: string;
}

export type EnvMap = Map<string, EnvEntry>;

/**
 * Parses a .env file content into key-value pairs.
 * Supports comments (#), quoted values, and blank lines.
 */
export function parseEnvContent(content: string, source: string): EnvMap {
  const result: EnvMap = new Map();
  const lines = content.split(/\r?\n/);

  for (const raw of lines) {
    const line = raw.trim();

    // Skip empty lines and comments
    if (!line || line.startsWith('#')) continue;

    const eqIndex = line.indexOf('=');
    if (eqIndex === -1) continue;

    const key = line.slice(0, eqIndex).trim();
    let value = line.slice(eqIndex + 1).trim();

    if (!key) continue;

    // Strip surrounding quotes (single or double)
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    result.set(key, { key, value, source });
  }

  return result;
}

/**
 * Reads and parses a .env file from disk.
 * Returns an empty map if the file does not exist.
 */
export function parseEnvFile(filePath: string): EnvMap {
  const resolved = path.resolve(filePath);

  if (!fs.existsSync(resolved)) {
    return new Map();
  }

  const content = fs.readFileSync(resolved, 'utf-8');
  return parseEnvContent(content, resolved);
}
