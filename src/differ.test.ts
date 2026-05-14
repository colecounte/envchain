import { describe, it, expect } from "vitest";
import { diffEnvMaps, formatDiff, hasDiff, type EnvMap } from "./differ";

function makeMap(obj: Record<string, string>): EnvMap {
  return { ...obj };
}

describe("diffEnvMaps", () => {
  it("returns empty array when maps are identical", () => {
    const m = makeMap({ A: "1", B: "2" });
    expect(diffEnvMaps(m, m)).toEqual([]);
  });

  it("detects added keys", () => {
    const base = makeMap({ A: "1" });
    const next = makeMap({ A: "1", B: "2" });
    const diff = diffEnvMaps(base, next);
    expect(diff).toHaveLength(1);
    expect(diff[0]).toEqual({ key: "B", type: "added", newValue: "2" });
  });

  it("detects removed keys", () => {
    const base = makeMap({ A: "1", B: "2" });
    const next = makeMap({ A: "1" });
    const diff = diffEnvMaps(base, next);
    expect(diff).toHaveLength(1);
    expect(diff[0]).toEqual({ key: "B", type: "removed", oldValue: "2" });
  });

  it("detects changed values", () => {
    const base = makeMap({ A: "old" });
    const next = makeMap({ A: "new" });
    const diff = diffEnvMaps(base, next);
    expect(diff).toHaveLength(1);
    expect(diff[0]).toEqual({ key: "A", type: "changed", oldValue: "old", newValue: "new" });
  });

  it("returns entries sorted by key", () => {
    const base = makeMap({ Z: "1", A: "1" });
    const next = makeMap({ Z: "2", A: "2" });
    const diff = diffEnvMaps(base, next);
    expect(diff.map((d) => d.key)).toEqual(["A", "Z"]);
  });
});

describe("formatDiff", () => {
  it("returns '(no changes)' for empty diff", () => {
    expect(formatDiff([])).toBe("(no changes)");
  });

  it("formats added entries with +", () => {
    const result = formatDiff([{ key: "FOO", type: "added", newValue: "bar" }]);
    expect(result).toBe("+ FOO=bar");
  });

  it("formats removed entries with -", () => {
    const result = formatDiff([{ key: "FOO", type: "removed", oldValue: "bar" }]);
    expect(result).toBe("- FOO=bar");
  });

  it("formats changed entries with ~", () => {
    const result = formatDiff([{ key: "FOO", type: "changed", oldValue: "a", newValue: "b" }]);
    expect(result).toBe("~ FOO: a → b");
  });

  it("joins multiple entries with newlines", () => {
    const base = makeMap({ A: "1" });
    const next = makeMap({ A: "2", B: "3" });
    const diff = diffEnvMaps(base, next);
    const formatted = formatDiff(diff);
    expect(formatted.split("\n")).toHaveLength(2);
  });
});

describe("hasDiff", () => {
  it("returns false for identical maps", () => {
    const m = makeMap({ X: "1" });
    expect(hasDiff(m, m)).toBe(false);
  });

  it("returns true when maps differ", () => {
    expect(hasDiff(makeMap({ A: "1" }), makeMap({ A: "2" }))).toBe(true);
  });
});
