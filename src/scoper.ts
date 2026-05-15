/**
 * scoper.ts — Scope env maps to a namespace by prefixing/unprefixing keys
 * and isolating variables belonging to a given scope.
 */

export type EnvMap = Map<string, string>;

export interface ScopeResult {
  scoped: EnvMap;
  remainder: EnvMap;
}

/**
 * Extract all keys that belong to a given scope (prefix) and return them
 * stripped of the prefix, plus any keys that did not match.
 */
export function scopeEnvMap(env: EnvMap, scope: string): ScopeResult {
  const prefix = scope.endsWith('_') ? scope : `${scope}_`;
  const scoped: EnvMap = new Map();
  const remainder: EnvMap = new Map();

  for (const [key, value] of env) {
    if (key.startsWith(prefix)) {
      scoped.set(key.slice(prefix.length), value);
    } else {
      remainder.set(key, value);
    }
  }

  return { scoped, remainder };
}

/**
 * Apply a scope prefix to all keys in an env map.
 */
export function applyScope(env: EnvMap, scope: string): EnvMap {
  const prefix = scope.endsWith('_') ? scope : `${scope}_`;
  const result: EnvMap = new Map();
  for (const [key, value] of env) {
    result.set(`${prefix}${key}`, value);
  }
  return result;
}

/**
 * List all distinct scope prefixes present in an env map.
 * A scope is detected when a key contains an underscore.
 */
export function detectScopes(env: EnvMap): string[] {
  const scopes = new Set<string>();
  for (const key of env.keys()) {
    const idx = key.indexOf('_');
    if (idx > 0) {
      scopes.add(key.slice(0, idx));
    }
  }
  return Array.from(scopes).sort();
}

/**
 * Merge a scoped map back into a base map, re-applying the prefix.
 */
export function mergeScoped(base: EnvMap, scoped: EnvMap, scope: string): EnvMap {
  const result: EnvMap = new Map(base);
  const prefixed = applyScope(scoped, scope);
  for (const [key, value] of prefixed) {
    result.set(key, value);
  }
  return result;
}
