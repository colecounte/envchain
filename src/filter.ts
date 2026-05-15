/**
 * filter.ts — Filter env maps by key patterns, prefixes, or value predicates
 */

export type FilterOptions = {
  include?: string[];   // glob-style prefix or exact key names to include
  exclude?: string[];   // glob-style prefix or exact key names to exclude
  predicate?: (key: string, value: string) => boolean;
};

/**
 * Returns true if the key matches any of the given patterns.
 * Patterns may be exact keys or end with '*' as a prefix wildcard.
 */
export function matchesPattern(key: string, patterns: string[]): boolean {
  return patterns.some((pattern) => {
    if (pattern.endsWith('*')) {
      return key.startsWith(pattern.slice(0, -1));
    }
    return key === pattern;
  });
}

/**
 * Filter an env map by include/exclude patterns and an optional predicate.
 * - If `include` is provided, only matching keys are kept.
 * - If `exclude` is provided, matching keys are removed.
 * - If `predicate` is provided, only entries for which it returns true are kept.
 */
export function filterEnvMap(
  env: Map<string, string>,
  options: FilterOptions = {}
): Map<string, string> {
  const { include, exclude, predicate } = options;
  const result = new Map<string, string>();

  for (const [key, value] of env) {
    if (include && include.length > 0 && !matchesPattern(key, include)) {
      continue;
    }
    if (exclude && exclude.length > 0 && matchesPattern(key, exclude)) {
      continue;
    }
    if (predicate && !predicate(key, value)) {
      continue;
    }
    result.set(key, value);
  }

  return result;
}

/**
 * Keep only keys whose values are non-empty strings.
 */
export function filterNonEmpty(env: Map<string, string>): Map<string, string> {
  return filterEnvMap(env, { predicate: (_, v) => v.trim().length > 0 });
}

/**
 * Keep only keys that match the given prefix (convenience wrapper).
 */
export function filterByPrefix(
  env: Map<string, string>,
  prefix: string
): Map<string, string> {
  return filterEnvMap(env, { include: [`${prefix}*`] });
}
