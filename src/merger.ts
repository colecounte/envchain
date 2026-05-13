import { EnvMap } from './parser';

export type ConflictStrategy = 'last-wins' | 'first-wins' | 'error';

export interface MergeOptions {
  strategy?: ConflictStrategy;
  contexts?: string[];
}

export interface MergeResult {
  env: EnvMap;
  conflicts: ConflictRecord[];
}

export interface ConflictRecord {
  key: string;
  values: { context: string; value: string }[];
  resolved: string;
}

export function mergeEnvMaps(
  maps: { context: string; env: EnvMap }[],
  options: MergeOptions = {}
): MergeResult {
  const strategy = options.strategy ?? 'last-wins';
  const result: EnvMap = {};
  const conflicts: ConflictRecord[] = [];
  const seen: Record<string, { context: string; value: string }[]> = {};

  for (const { context, env } of maps) {
    for (const [key, value] of Object.entries(env)) {
      if (!seen[key]) {
        seen[key] = [];
      }
      seen[key].push({ context, value });
    }
  }

  for (const [key, entries] of Object.entries(seen)) {
    if (entries.length === 1) {
      result[key] = entries[0].value;
      continue;
    }

    if (strategy === 'error') {
      const contexts = entries.map((e) => e.context).join(', ');
      throw new Error(
        `Conflict for key "${key}" found in contexts: ${contexts}`
      );
    }

    const resolved =
      strategy === 'first-wins'
        ? entries[0].value
        : entries[entries.length - 1].value;

    result[key] = resolved;
    conflicts.push({ key, values: entries, resolved });
  }

  return { env: result, conflicts };
}
