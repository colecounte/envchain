// Groups env vars by prefix, namespace, or custom criteria

export type GroupMap = Map<string, Map<string, string>>;

export function groupByPrefix(
  env: Map<string, string>,
  separator = "_"
): GroupMap {
  const groups: GroupMap = new Map();
  for (const [key, value] of env) {
    const idx = key.indexOf(separator);
    const group = idx !== -1 ? key.slice(0, idx) : "__ungrouped__";
    if (!groups.has(group)) groups.set(group, new Map());
    groups.get(group)!.set(key, value);
  }
  return groups;
}

export function groupByPattern(
  env: Map<string, string>,
  patterns: Record<string, RegExp>
): GroupMap {
  const groups: GroupMap = new Map();
  const matched = new Set<string>();
  for (const [label, pattern] of Object.entries(patterns)) {
    const group: Map<string, string> = new Map();
    for (const [key, value] of env) {
      if (pattern.test(key)) {
        group.set(key, value);
        matched.add(key);
      }
    }
    if (group.size > 0) groups.set(label, group);
  }
  const ungrouped: Map<string, string> = new Map();
  for (const [key, value] of env) {
    if (!matched.has(key)) ungrouped.set(key, value);
  }
  if (ungrouped.size > 0) groups.set("__ungrouped__", ungrouped);
  return groups;
}

export function flattenGroups(groups: GroupMap): Map<string, string> {
  const result = new Map<string, string>();
  for (const group of groups.values()) {
    for (const [key, value] of group) {
      result.set(key, value);
    }
  }
  return result;
}

export function formatGroups(groups: GroupMap): string {
  const lines: string[] = [];
  for (const [group, vars] of groups) {
    lines.push(`[${group}]`);
    for (const [key, value] of vars) {
      lines.push(`  ${key}=${value}`);
    }
  }
  return lines.join("\n");
}
