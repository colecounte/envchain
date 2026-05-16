/**
 * aliaser.ts — Map environment variable keys to alternate names (aliases)
 */

export type AliasMap = Record<string, string>; // alias -> original

/**
 * Build an alias map from a list of "ALIAS=ORIGINAL" strings.
 */
export function parseAliasArgs(args: string[]): AliasMap {
  const map: AliasMap = {};
  for (const arg of args) {
    const eq = arg.indexOf("=");
    if (eq < 1) throw new Error(`Invalid alias spec (expected ALIAS=ORIGINAL): ${arg}`);
    const alias = arg.slice(0, eq).trim();
    const original = arg.slice(eq + 1).trim();
    if (!alias || !original) throw new Error(`Empty alias or original in spec: ${arg}`);
    map[alias] = original;
  }
  return map;
}

/**
 * Apply aliases to an env map: for each alias->original pair,
 * add the alias key with the value of the original key (if present).
 * The original key is preserved unless `removeOriginal` is true.
 */
export function applyAliases(
  env: Record<string, string>,
  aliases: AliasMap,
  removeOriginal = false
): Record<string, string> {
  const result: Record<string, string> = { ...env };
  for (const [alias, original] of Object.entries(aliases)) {
    if (Object.prototype.hasOwnProperty.call(env, original)) {
      result[alias] = env[original];
      if (removeOriginal) delete result[original];
    }
  }
  return result;
}

/**
 * Return a summary of which aliases were resolved vs missing.
 */
export function formatAliasSummary(
  env: Record<string, string>,
  aliases: AliasMap
): string {
  const lines: string[] = [];
  for (const [alias, original] of Object.entries(aliases)) {
    const found = Object.prototype.hasOwnProperty.call(env, original);
    lines.push(found ? `  ${alias} <- ${original} (ok)` : `  ${alias} <- ${original} (missing)`);
  }
  return lines.join("\n");
}
