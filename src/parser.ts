import { readFile } from 'fs/promises';

export type EnvMap = Record<string, string>;

export function parseEnvContent(content: string): EnvMap {
  const result: EnvMap = {};
  const lines = content.split(/\r?\n/);

  for (const raw of lines) {
    const line = raw.trim();

    if (!line || line.startsWith('#')) {
      continue;
    }

    const eqIndex = line.indexOf('=');
    if (eqIndex === -1) {
      continue;
    }

    const key = line.slice(0, eqIndex).trim();
    let value = line.slice(eqIndex + 1).trim();

    if (!key) continue;

    // Strip surrounding quotes
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    result[key] = value;
  }

  return result;
}

export async function parseEnvFile(filePath: string): Promise<EnvMap> {
  let content: string;
  try {
    content = await readFile(filePath, 'utf-8');
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return {};
    }
    throw err;
  }
  return parseEnvContent(content);
}
