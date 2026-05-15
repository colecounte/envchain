/**
 * Deduplicator: detect and remove duplicate keys across env maps,
 * with configurable strategies (last-wins, first-wins, error).
 */

export type DedupeStrategy = "last-wins" | "first-wins" | "error";

export interface DuplicateEntry {
  key: string;
  values: string[];
  sources: string[];
}

export interface DedupeResult {
  env: Map<string, string>;
  duplicates: DuplicateEntry[];
}

export function findDuplicates(
  maps: Array<{ label: string; env: Map<string, string> }>
): DuplicateEntry[] {
  const seen = new Map<string, { values: string[]; sources: string[] }>();

  for (const { label, env } of maps) {
    for (const [key, value] of env) {
      if (!seen.has(key)) {
        seen.set(key, { values: [], sources: [] });
      }
      const entry = seen.get(key)!;
      entry.values.push(value);
      entry.sources.push(label);
    }
  }

  return Array.from(seen.entries())
    .filter(([, e]) => e.sources.length > 1)
    .map(([key, e]) => ({ key, values: e.values, sources: e.sources }));
}

export function deduplicateEnvMaps(
  maps: Array<{ label: string; env: Map<string, string> }>,
  strategy: DedupeStrategy = "last-wins"
): DedupeResult {
  const duplicates = findDuplicates(maps);

  if (strategy === "error" && duplicates.length > 0) {
    const keys = duplicates.map((d) => d.key).join(", ");
    throw new Error(`Duplicate keys found: ${keys}`);
  }

  const result = new Map<string, string>();

  const ordered = strategy === "first-wins" ? [...maps].reverse() : maps;
  for (const { env } of ordered) {
    for (const [key, value] of env) {
      result.set(key, value);
    }
  }

  return { env: result, duplicates };
}

export function formatDuplicates(duplicates: DuplicateEntry[]): string {
  if (duplicates.length === 0) return "No duplicates found.";
  return duplicates
    .map(
      (d) =>
        `  ${d.key}: [${d.sources.map((s, i) => `${s}=${d.values[i]}`).join(", ")}]`
    )
    .join("\n");
}
