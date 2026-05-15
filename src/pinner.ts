/**
 * pinner.ts — Pin specific env keys to fixed values, preventing them from
 * being overridden during merge/resolve operations.
 */

export type PinMap = Map<string, string>;

export interface PinEntry {
  key: string;
  value: string;
  pinnedAt: string; // ISO timestamp
}

export type PinRecord = Record<string, PinEntry>;

/** Create a new PinMap from a plain record */
export function createPinMap(entries: Record<string, string>): PinMap {
  return new Map(Object.entries(entries));
}

/** Apply pinned values on top of an env map — pinned keys always win */
export function applyPins(
  envMap: Map<string, string>,
  pins: PinMap
): Map<string, string> {
  const result = new Map(envMap);
  for (const [key, value] of pins) {
    result.set(key, value);
  }
  return result;
}

/** Add a pin entry to a PinRecord */
export function addPin(
  record: PinRecord,
  key: string,
  value: string
): PinRecord {
  return {
    ...record,
    [key]: { key, value, pinnedAt: new Date().toISOString() },
  };
}

/** Remove a pin entry from a PinRecord */
export function removePin(record: PinRecord, key: string): PinRecord {
  const next = { ...record };
  delete next[key];
  return next;
}

/** Convert a PinRecord to a PinMap for use in applyPins */
export function pinRecordToMap(record: PinRecord): PinMap {
  const map = new Map<string, string>();
  for (const entry of Object.values(record)) {
    map.set(entry.key, entry.value);
  }
  return map;
}

/** List all pinned keys with metadata */
export function listPins(record: PinRecord): PinEntry[] {
  return Object.values(record).sort((a, b) =>
    a.key.localeCompare(b.key)
  );
}

/** Format a human-readable summary of pinned keys */
export function formatPinSummary(record: PinRecord): string {
  const entries = listPins(record);
  if (entries.length === 0) return "No pinned keys.";
  return entries
    .map((e) => `  ${e.key}=${e.value}  (pinned ${e.pinnedAt})`)
    .join("\n");
}
