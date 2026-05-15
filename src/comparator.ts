import { EnvMap } from './merger';

export type CompareResult = {
  added: Record<string, string>;
  removed: Record<string, string>;
  changed: Record<string, { from: string; to: string }>;
  unchanged: Record<string, string>;
};

export function compareEnvMaps(base: EnvMap, target: EnvMap): CompareResult {
  const result: CompareResult = {
    added: {},
    removed: {},
    changed: {},
    unchanged: {},
  };

  for (const [key, value] of Object.entries(target)) {
    if (!(key in base)) {
      result.added[key] = value;
    } else if (base[key] !== value) {
      result.changed[key] = { from: base[key], to: value };
    } else {
      result.unchanged[key] = value;
    }
  }

  for (const [key, value] of Object.entries(base)) {
    if (!(key in target)) {
      result.removed[key] = value;
    }
  }

  return result;
}

export function formatCompareResult(result: CompareResult, verbose = false): string {
  const lines: string[] = [];

  for (const [key, value] of Object.entries(result.added)) {
    lines.push(`+ ${key}=${value}`);
  }

  for (const [key, value] of Object.entries(result.removed)) {
    lines.push(`- ${key}=${value}`);
  }

  for (const [key, { from, to }] of Object.entries(result.changed)) {
    lines.push(`~ ${key}: ${from} -> ${to}`);
  }

  if (verbose) {
    for (const [key, value] of Object.entries(result.unchanged)) {
      lines.push(`  ${key}=${value}`);
    }
  }

  return lines.join('\n');
}

export function hasChanges(result: CompareResult): boolean {
  return (
    Object.keys(result.added).length > 0 ||
    Object.keys(result.removed).length > 0 ||
    Object.keys(result.changed).length > 0
  );
}

export function summarizeCompare(result: CompareResult): string {
  const parts: string[] = [];
  const a = Object.keys(result.added).length;
  const r = Object.keys(result.removed).length;
  const c = Object.keys(result.changed).length;
  const u = Object.keys(result.unchanged).length;
  if (a) parts.push(`${a} added`);
  if (r) parts.push(`${r} removed`);
  if (c) parts.push(`${c} changed`);
  if (u) parts.push(`${u} unchanged`);
  return parts.length ? parts.join(', ') : 'no differences';
}
