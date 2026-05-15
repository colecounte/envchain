import { describe, it, expect } from "vitest";
import { applyPatches, parsePatchArgs, formatPatchSummary } from "./patcher";

function makeMap(obj: Record<string, string>): Map<string, string> {
  return new Map(Object.entries(obj));
}

describe("applyPatches", () => {
  it("sets a new key", () => {
    const base = makeMap({ A: "1" });
    const { map, applied, skipped } = applyPatches(base, [{ op: "set", key: "B", value: "2" }]);
    expect(map.get("B")).toBe("2");
    expect(applied).toHaveLength(1);
    expect(skipped).toHaveLength(0);
  });

  it("overwrites an existing key", () => {
    const base = makeMap({ A: "old" });
    const { map } = applyPatches(base, [{ op: "set", key: "A", value: "new" }]);
    expect(map.get("A")).toBe("new");
  });

  it("unsets an existing key", () => {
    const base = makeMap({ A: "1", B: "2" });
    const { map, applied } = applyPatches(base, [{ op: "unset", key: "A" }]);
    expect(map.has("A")).toBe(false);
    expect(map.get("B")).toBe("2");
    expect(applied).toHaveLength(1);
  });

  it("skips unset for missing key", () => {
    const base = makeMap({ A: "1" });
    const { skipped } = applyPatches(base, [{ op: "unset", key: "MISSING" }]);
    expect(skipped).toHaveLength(1);
  });

  it("renames an existing key", () => {
    const base = makeMap({ OLD: "val" });
    const { map, applied } = applyPatches(base, [{ op: "rename", from: "OLD", to: "NEW" }]);
    expect(map.has("OLD")).toBe(false);
    expect(map.get("NEW")).toBe("val");
    expect(applied).toHaveLength(1);
  });

  it("skips rename for missing key", () => {
    const base = makeMap({});
    const { skipped } = applyPatches(base, [{ op: "rename", from: "X", to: "Y" }]);
    expect(skipped).toHaveLength(1);
  });

  it("does not mutate the original map", () => {
    const base = makeMap({ A: "1" });
    applyPatches(base, [{ op: "set", key: "B", value: "2" }]);
    expect(base.has("B")).toBe(false);
  });
});

describe("parsePatchArgs", () => {
  it("parses --set", () => {
    const ops = parsePatchArgs(["--set=FOO=bar"]);
    expect(ops).toEqual([{ op: "set", key: "FOO", value: "bar" }]);
  });

  it("parses --unset", () => {
    const ops = parsePatchArgs(["--unset=FOO"]);
    expect(ops).toEqual([{ op: "unset", key: "FOO" }]);
  });

  it("parses --rename", () => {
    const ops = parsePatchArgs(["--rename=OLD:NEW"]);
    expect(ops).toEqual([{ op: "rename", from: "OLD", to: "NEW" }]);
  });

  it("throws on invalid --set", () => {
    expect(() => parsePatchArgs(["--set=NOEQUALS"])).toThrow();
  });

  it("ignores unrecognised flags", () => {
    const ops = parsePatchArgs(["--context=local"]);
    expect(ops).toHaveLength(0);
  });
});

describe("formatPatchSummary", () => {
  it("formats applied and skipped ops", () => {
    const base = makeMap({ A: "1" });
    const result = applyPatches(base, [
      { op: "set", key: "B", value: "2" },
      { op: "unset", key: "MISSING" },
      { op: "rename", key: "A", from: "A", to: "C" } as any,
    ]);
    const summary = formatPatchSummary(result);
    expect(summary).toContain("SET");
    expect(summary).toContain("SKIP");
  });
});
