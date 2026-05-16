/**
 * splitter.ts — Split an env map into multiple maps by prefix or pattern
 */

export type EnvMap = Map<string, string>;

export interface SplitResult {
  groups: Record<string, EnvMap>;
  unmatched: EnvMap;
}

/**
 * Split an EnvMap into named groups by prefix.
 * Keys are stripped of their prefix in the resulting maps.
 */
export function splitByPrefix(
  env: EnvMap,
  prefixes: string[]
): SplitResult {
  const groups: Record<string, EnvMap> = {};
  const unmatched: EnvMap = new Map();

  for (const prefix of prefixes) {
    groups[prefix] = new Map();
  }

  for (const [key, value] of env) {
    const matched = prefixes.find((p) => key.startsWith(p + "_") || key === p);
    if (matched) {
      const stripped = key.startsWith(matched + "_")
        ? key.slice(matched.length + 1)
        : key;
      groups[matched].set(stripped, value);
    } else {
      unmatched.set(key, value);
    }
  }

  return { groups, unmatched };
}

/**
 * Split an EnvMap into named groups by regex pattern.
 * The pattern must have a named capture group `name`.
 */
export function splitByPattern(
  env: EnvMap,
  patterns: Record<string, RegExp>
): SplitResult {
  const groups: Record<string, EnvMap> = {};
  const unmatched: EnvMap = new Map();

  for (const name of Object.keys(patterns)) {
    groups[name] = new Map();
  }

  for (const [key, value] of env) {
    let matched = false;
    for (const [name, pattern] of Object.entries(patterns)) {
      if (pattern.test(key)) {
        groups[name].set(key, value);
        matched = true;
        break;
      }
    }
    if (!matched) {
      unmatched.set(key, value);
    }
  }

  return { groups, unmatched };
}

/**
 * Format a SplitResult as a human-readable string.
 */
export function formatSplitResult(result: SplitResult): string {
  const lines: string[] = [];
  for (const [group, map] of Object.entries(result.groups)) {
    lines.push(`[${group}] (${map.size} keys)`);
    for (const [k, v] of map) {
      lines.push(`  ${k}=${v}`);
    }
  }
  if (result.unmatched.size > 0) {
    lines.push(`[unmatched] (${result.unmatched.size} keys)`);
    for (const [k, v] of result.unmatched) {
      lines.push(`  ${k}=${v}`);
    }
  }
  return lines.join("\n");
}
