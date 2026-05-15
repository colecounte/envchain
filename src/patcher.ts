/**
 * patcher.ts — Apply key-value patches to an env map, supporting set, unset, and rename operations.
 */

export type PatchOp =
  | { op: "set"; key: string; value: string }
  | { op: "unset"; key: string }
  | { op: "rename"; from: string; to: string };

export type PatchResult = {
  map: Map<string, string>;
  applied: PatchOp[];
  skipped: PatchOp[];
};

export function applyPatches(
  base: Map<string, string>,
  patches: PatchOp[]
): PatchResult {
  const map = new Map(base);
  const applied: PatchOp[] = [];
  const skipped: PatchOp[] = [];

  for (const patch of patches) {
    if (patch.op === "set") {
      map.set(patch.key, patch.value);
      applied.push(patch);
    } else if (patch.op === "unset") {
      if (map.has(patch.key)) {
        map.delete(patch.key);
        applied.push(patch);
      } else {
        skipped.push(patch);
      }
    } else if (patch.op === "rename") {
      if (map.has(patch.from)) {
        const val = map.get(patch.from)!;
        map.delete(patch.from);
        map.set(patch.to, val);
        applied.push(patch);
      } else {
        skipped.push(patch);
      }
    }
  }

  return { map, applied, skipped };
}

export function parsePatchArgs(args: string[]): PatchOp[] {
  const ops: PatchOp[] = [];
  for (const arg of args) {
    if (arg.startsWith("--set=")) {
      const kv = arg.slice(6);
      const eq = kv.indexOf("=");
      if (eq === -1) throw new Error(`Invalid --set value: ${arg}`);
      ops.push({ op: "set", key: kv.slice(0, eq), value: kv.slice(eq + 1) });
    } else if (arg.startsWith("--unset=")) {
      ops.push({ op: "unset", key: arg.slice(8) });
    } else if (arg.startsWith("--rename=")) {
      const pair = arg.slice(9);
      const sep = pair.indexOf(":");
      if (sep === -1) throw new Error(`Invalid --rename value: ${arg}`);
      ops.push({ op: "rename", from: pair.slice(0, sep), to: pair.slice(sep + 1) });
    }
  }
  return ops;
}

export function formatPatchSummary(result: PatchResult): string {
  const lines: string[] = [];
  for (const op of result.applied) {
    if (op.op === "set") lines.push(`  SET   ${op.key}=${op.value}`);
    else if (op.op === "unset") lines.push(`  UNSET ${op.key}`);
    else if (op.op === "rename") lines.push(`  RENAME ${op.from} -> ${op.to}`);
  }
  for (const op of result.skipped) {
    if (op.op === "unset") lines.push(`  SKIP  unset ${op.key} (not found)`);
    else if (op.op === "rename") lines.push(`  SKIP  rename ${op.from} (not found)`);
  }
  return lines.join("\n");
}
