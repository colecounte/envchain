/**
 * pruner.ts — Remove unused or empty env vars from a map
 */

export type PruneOptions = {
  removeEmpty?: boolean;
  removeWhitespaceOnly?: boolean;
  keys?: string[];
};

export type PruneResult = {
  pruned: Map<string, string>;
  removedKeys: string[];
  originalCount: number;
  prunedCount: number;
};

export function pruneEnvMap(
  env: Map<string, string>,
  options: PruneOptions = {}
): PruneResult {
  const { removeEmpty = true, removeWhitespaceOnly = true, keys } = options;
  const pruned = new Map<string, string>();
  const removedKeys: string[] = [];

  for (const [key, value] of env) {
    let shouldRemove = false;

    if (keys && keys.length > 0) {
      shouldRemove = keys.includes(key);
    } else {
      if (removeEmpty && value === "") {
        shouldRemove = true;
      } else if (removeWhitespaceOnly && value.trim() === "") {
        shouldRemove = true;
      }
    }

    if (shouldRemove) {
      removedKeys.push(key);
    } else {
      pruned.set(key, value);
    }
  }

  return {
    pruned,
    removedKeys,
    originalCount: env.size,
    prunedCount: removedKeys.length,
  };
}

export function formatPruneSummary(result: PruneResult): string {
  if (result.prunedCount === 0) {
    return "No keys pruned.";
  }
  const lines = [
    `Pruned ${result.prunedCount} of ${result.originalCount} keys:`,
    ...result.removedKeys.map((k) => `  - ${k}`),
  ];
  return lines.join("\n");
}
