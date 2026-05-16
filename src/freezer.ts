/**
 * freezer.ts — Freeze/lock env maps to prevent accidental mutation.
 * Supports creating frozen snapshots, detecting drift, and enforcing locks.
 */

export type FrozenEnvMap = Readonly<Record<string, string>>;

export interface FreezeRecord {
  frozenAt: string;
  context: string;
  map: FrozenEnvMap;
}

export function freezeEnvMap(map: Record<string, string>): FrozenEnvMap {
  return Object.freeze({ ...map });
}

export function isFrozen(map: Record<string, string>): boolean {
  return Object.isFrozen(map);
}

export function createFreezeRecord(
  map: Record<string, string>,
  context: string = "default"
): FreezeRecord {
  return {
    frozenAt: new Date().toISOString(),
    context,
    map: freezeEnvMap(map),
  };
}

export function detectDrift(
  frozen: FrozenEnvMap,
  current: Record<string, string>
): Record<string, { frozen: string | undefined; current: string | undefined }> {
  const drift: Record<string, { frozen: string | undefined; current: string | undefined }> = {};
  const allKeys = new Set([...Object.keys(frozen), ...Object.keys(current)]);
  for (const key of allKeys) {
    if (frozen[key] !== current[key]) {
      drift[key] = { frozen: frozen[key], current: current[key] };
    }
  }
  return drift;
}

export function hasDrift(
  frozen: FrozenEnvMap,
  current: Record<string, string>
): boolean {
  return Object.keys(detectDrift(frozen, current)).length > 0;
}

export function formatDrift(
  drift: Record<string, { frozen: string | undefined; current: string | undefined }>
): string {
  const lines: string[] = [];
  for (const [key, { frozen, current }] of Object.entries(drift)) {
    if (frozen === undefined) {
      lines.push(`+ ${key}=${current} (added)`);
    } else if (current === undefined) {
      lines.push(`- ${key}=${frozen} (removed)`);
    } else {
      lines.push(`~ ${key}: "${frozen}" → "${current}"`);
    }
  }
  return lines.join("\n");
}
