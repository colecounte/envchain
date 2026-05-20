import { EnvMap } from "./merger";

export interface CloneOptions {
  prefix?: string;
  suffix?: string;
  overwrite?: boolean;
  keys?: string[];
}

export interface CloneResult {
  cloned: EnvMap;
  skipped: string[];
  added: string[];
}

/**
 * Clone an EnvMap, optionally filtering keys and renaming via prefix/suffix.
 * Returns a new map merged into target, with conflict tracking.
 */
export function cloneEnvMap(
  source: EnvMap,
  target: EnvMap,
  options: CloneOptions = {}
): CloneResult {
  const { prefix = "", suffix = "", overwrite = false, keys } = options;
  const cloned: EnvMap = { ...target };
  const skipped: string[] = [];
  const added: string[] = [];

  const sourceKeys = keys ? keys.filter((k) => k in source) : Object.keys(source);

  for (const key of sourceKeys) {
    const newKey = `${prefix}${key}${suffix}`;
    if (newKey in cloned && !overwrite) {
      skipped.push(newKey);
      continue;
    }
    cloned[newKey] = source[key];
    added.push(newKey);
  }

  return { cloned, skipped, added };
}

export function formatCloneResult(result: CloneResult): string {
  const lines: string[] = [];
  if (result.added.length > 0) {
    lines.push(`Cloned ${result.added.length} key(s): ${result.added.join(", ")}`);
  }
  if (result.skipped.length > 0) {
    lines.push(`Skipped ${result.skipped.length} existing key(s): ${result.skipped.join(", ")}`);
  }
  if (lines.length === 0) {
    lines.push("Nothing cloned.");
  }
  return lines.join("\n");
}
