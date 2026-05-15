/**
 * sorter.ts — Sort and group environment variable maps
 */

export type SortOrder = "asc" | "desc";

export interface SortOptions {
  order?: SortOrder;
  groupByPrefix?: boolean;
  prefixDelimiter?: string;
}

/**
 * Sort an env map by key alphabetically.
 */
export function sortEnvMap(
  env: Map<string, string>,
  order: SortOrder = "asc"
): Map<string, string> {
  const entries = [...env.entries()];
  entries.sort(([a], [b]) =>
    order === "asc" ? a.localeCompare(b) : b.localeCompare(a)
  );
  return new Map(entries);
}

/**
 * Group env entries by their key prefix (e.g. "DB_HOST" → group "DB").
 */
export function groupEnvByPrefix(
  env: Map<string, string>,
  delimiter = "_"
): Map<string, Map<string, string>> {
  const groups = new Map<string, Map<string, string>>();

  for (const [key, value] of env) {
    const delimIdx = key.indexOf(delimiter);
    const prefix = delimIdx !== -1 ? key.slice(0, delimIdx) : "__ungrouped__";

    if (!groups.has(prefix)) {
      groups.set(prefix, new Map());
    }
    groups.get(prefix)!.set(key, value);
  }

  return groups;
}

/**
 * Sort and optionally group an env map.
 */
export function sortAndGroup(
  env: Map<string, string>,
  options: SortOptions = {}
): Map<string, string> | Map<string, Map<string, string>> {
  const { order = "asc", groupByPrefix = false, prefixDelimiter = "_" } = options;

  const sorted = sortEnvMap(env, order);

  if (groupByPrefix) {
    return groupEnvByPrefix(sorted, prefixDelimiter);
  }

  return sorted;
}
