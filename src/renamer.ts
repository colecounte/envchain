/**
 * renamer.ts — Rename or prefix/suffix environment variable keys in an EnvMap.
 */

export type RenameMap = Record<string, string>;

export interface RenameOptions {
  prefix?: string;
  suffix?: string;
  strip?: string;
  renames?: RenameMap;
}

/**
 * Apply an explicit rename map to an EnvMap.
 * Keys not present in the rename map are left unchanged.
 */
export function applyRenames(
  env: Map<string, string>,
  renames: RenameMap
): Map<string, string> {
  const result = new Map<string, string>();
  for (const [key, value] of env) {
    const newKey = renames[key] ?? key;
    result.set(newKey, value);
  }
  return result;
}

/**
 * Add a prefix to all keys in an EnvMap.
 */
export function prefixKeys(
  env: Map<string, string>,
  prefix: string
): Map<string, string> {
  const result = new Map<string, string>();
  for (const [key, value] of env) {
    result.set(`${prefix}${key}`, value);
  }
  return result;
}

/**
 * Add a suffix to all keys in an EnvMap.
 */
export function suffixKeys(
  env: Map<string, string>,
  suffix: string
): Map<string, string> {
  const result = new Map<string, string>();
  for (const [key, value] of env) {
    result.set(`${key}${suffix}`, value);
  }
  return result;
}

/**
 * Strip a leading prefix from keys that have it.
 */
export function stripPrefix(
  env: Map<string, string>,
  prefix: string
): Map<string, string> {
  const result = new Map<string, string>();
  for (const [key, value] of env) {
    const newKey = key.startsWith(prefix) ? key.slice(prefix.length) : key;
    result.set(newKey, value);
  }
  return result;
}

/**
 * Apply all rename options in order: strip → explicit renames → prefix → suffix.
 */
export function renameEnvMap(
  env: Map<string, string>,
  options: RenameOptions
): Map<string, string> {
  let result = new Map(env);
  if (options.strip) result = stripPrefix(result, options.strip);
  if (options.renames) result = applyRenames(result, options.renames);
  if (options.prefix) result = prefixKeys(result, options.prefix);
  if (options.suffix) result = suffixKeys(result, options.suffix);
  return result;
}
