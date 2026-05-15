/**
 * tagger.ts — Tag env keys with metadata labels (e.g. "secret", "required", "deprecated")
 */

export type Tag = "secret" | "required" | "deprecated" | "readonly" | string;

export type TagMap = Map<string, Set<Tag>>;

export function createTagMap(): TagMap {
  return new Map();
}

export function addTag(tagMap: TagMap, key: string, tag: Tag): TagMap {
  const result = new Map(tagMap);
  const existing = result.get(key) ?? new Set();
  result.set(key, new Set([...existing, tag]));
  return result;
}

export function removeTag(tagMap: TagMap, key: string, tag: Tag): TagMap {
  const result = new Map(tagMap);
  const existing = result.get(key);
  if (!existing) return result;
  const updated = new Set([...existing].filter((t) => t !== tag));
  if (updated.size === 0) result.delete(key);
  else result.set(key, updated);
  return result;
}

export function getTags(tagMap: TagMap, key: string): Set<Tag> {
  return tagMap.get(key) ?? new Set();
}

export function hasTag(tagMap: TagMap, key: string, tag: Tag): boolean {
  return getTags(tagMap, key).has(tag);
}

export function filterByTag(envMap: Map<string, string>, tagMap: TagMap, tag: Tag): Map<string, string> {
  const result = new Map<string, string>();
  for (const [key, value] of envMap) {
    if (hasTag(tagMap, key, tag)) result.set(key, value);
  }
  return result;
}

export function tagMapToRecord(tagMap: TagMap): Record<string, string[]> {
  const record: Record<string, string[]> = {};
  for (const [key, tags] of tagMap) {
    record[key] = [...tags].sort();
  }
  return record;
}

export function tagMapFromRecord(record: Record<string, string[]>): TagMap {
  const tagMap: TagMap = new Map();
  for (const [key, tags] of Object.entries(record)) {
    tagMap.set(key, new Set(tags));
  }
  return tagMap;
}

export function mergeTags(a: TagMap, b: TagMap): TagMap {
  const result = new Map(a);
  for (const [key, tags] of b) {
    const existing = result.get(key) ?? new Set();
    result.set(key, new Set([...existing, ...tags]));
  }
  return result;
}
