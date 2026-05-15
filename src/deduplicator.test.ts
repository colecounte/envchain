import { describe, it, expect } from "vitest";
import {
  findDuplicates,
  deduplicateEnvMaps,
  formatDuplicates,
} from "./deduplicator";

function makeMap(obj: Record<string, string>): Map<string, string> {
  return new Map(Object.entries(obj));
}

describe("findDuplicates", () => {
  it("returns empty when no duplicates", () => {
    const maps = [
      { label: "a", env: makeMap({ FOO: "1" }) },
      { label: "b", env: makeMap({ BAR: "2" }) },
    ];
    expect(findDuplicates(maps)).toEqual([]);
  });

  it("detects a duplicate key across maps", () => {
    const maps = [
      { label: "base", env: makeMap({ FOO: "1", BAR: "x" }) },
      { label: "local", env: makeMap({ FOO: "2" }) },
    ];
    const dups = findDuplicates(maps);
    expect(dups).toHaveLength(1);
    expect(dups[0].key).toBe("FOO");
    expect(dups[0].values).toEqual(["1", "2"]);
    expect(dups[0].sources).toEqual(["base", "local"]);
  });

  it("detects multiple duplicate keys", () => {
    const maps = [
      { label: "a", env: makeMap({ X: "1", Y: "hello" }) },
      { label: "b", env: makeMap({ X: "2", Y: "world" }) },
    ];
    const dups = findDuplicates(maps);
    expect(dups.map((d) => d.key).sort()).toEqual(["X", "Y"]);
  });
});

describe("deduplicateEnvMaps", () => {
  it("last-wins strategy keeps last value", () => {
    const maps = [
      { label: "a", env: makeMap({ FOO: "first" }) },
      { label: "b", env: makeMap({ FOO: "last" }) },
    ];
    const { env } = deduplicateEnvMaps(maps, "last-wins");
    expect(env.get("FOO")).toBe("last");
  });

  it("first-wins strategy keeps first value", () => {
    const maps = [
      { label: "a", env: makeMap({ FOO: "first" }) },
      { label: "b", env: makeMap({ FOO: "last" }) },
    ];
    const { env } = deduplicateEnvMaps(maps, "first-wins");
    expect(env.get("FOO")).toBe("first");
  });

  it("error strategy throws on duplicates", () => {
    const maps = [
      { label: "a", env: makeMap({ FOO: "1" }) },
      { label: "b", env: makeMap({ FOO: "2" }) },
    ];
    expect(() => deduplicateEnvMaps(maps, "error")).toThrow(/FOO/);
  });

  it("returns duplicates list", () => {
    const maps = [
      { label: "a", env: makeMap({ A: "1", B: "x" }) },
      { label: "b", env: makeMap({ A: "2" }) },
    ];
    const { duplicates } = deduplicateEnvMaps(maps);
    expect(duplicates).toHaveLength(1);
    expect(duplicates[0].key).toBe("A");
  });
});

describe("formatDuplicates", () => {
  it("returns no-duplicates message for empty list", () => {
    expect(formatDuplicates([])).toMatch(/No duplicates/);
  });

  it("formats duplicate entries", () => {
    const dups = [
      { key: "FOO", values: ["1", "2"], sources: ["base", "local"] },
    ];
    const out = formatDuplicates(dups);
    expect(out).toContain("FOO");
    expect(out).toContain("base=1");
    expect(out).toContain("local=2");
  });
});
