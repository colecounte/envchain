/**
 * differ.ts — Computes diffs between two EnvMaps and formats the result.
 */

export type DiffEntry = {
  key: string;
  type: "added" | "removed" | "changed";
  oldValue?: string;
  newValue?: string;
};

export type EnvMap = Record<string, string>;

/**
 * Compute a diff between two EnvMaps.
 * Returns an array of DiffEntry describing what changed.
 */
export function diffEnvMaps(base: EnvMap, next: EnvMap): DiffEntry[] {
  const entries: DiffEntry[] = [];
  const allKeys = new Set([...Object.keys(base), ...Object.keys(next)]);

  for (const key of [...allKeys].sort()) {
    const inBase = Object.prototype.hasOwnProperty.call(base, key);
    const inNext = Object.prototype.hasOwnProperty.call(next, key);

    if (inBase && !inNext) {
      entries.push({ key, type: "removed", oldValue: base[key] });
    } else if (!inBase && inNext) {
      entries.push({ key, type: "added", newValue: next[key] });
    } else if (base[key] !== next[key]) {
      entries.push({ key, type: "changed", oldValue: base[key], newValue: next[key] });
    }
  }

  return entries;
}

/**
 * Format a list of DiffEntry objects into a human-readable string.
 */
export function formatDiff(entries: DiffEntry[]): string {
  if (entries.length === 0) return "(no changes)";

  return entries
    .map((e) => {
      switch (e.type) {
        case "added":
          return `+ ${e.key}=${e.newValue}`;
        case "removed":
          return `- ${e.key}=${e.oldValue}`;
        case "changed":
          return `~ ${e.key}: ${e.oldValue} → ${e.newValue}`;
      }
    })
    .join("\n");
}

/**
 * Returns true if there are any differences between the two maps.
 */
export function hasDiff(base: EnvMap, next: EnvMap): boolean {
  return diffEnvMaps(base, next).length > 0;
}
