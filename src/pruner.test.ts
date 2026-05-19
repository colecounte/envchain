import { describe, it, expect } from "vitest";
import { pruneEnvMap, formatPruneSummary } from "./pruner";

function makeMap(obj: Record<string, string>): Map<string, string> {
  return new Map(Object.entries(obj));
}

describe("pruneEnvMap", () => {
  it("removes empty string values by default", () => {
    const env = makeMap({ A: "hello", B: "", C: "world" });
    const { pruned, removedKeys } = pruneEnvMap(env);
    expect(pruned.has("A")).toBe(true);
    expect(pruned.has("C")).toBe(true);
    expect(pruned.has("B")).toBe(false);
    expect(removedKeys).toContain("B");
  });

  it("removes whitespace-only values by default", () => {
    const env = makeMap({ A: "val", B: "   ", C: "\t" });
    const { pruned, removedKeys } = pruneEnvMap(env);
    expect(pruned.has("B")).toBe(false);
    expect(pruned.has("C")).toBe(false);
    expect(removedKeys).toEqual(expect.arrayContaining(["B", "C"]));
  });

  it("keeps whitespace-only values when removeWhitespaceOnly is false", () => {
    const env = makeMap({ A: "  ", B: "" });
    const { pruned } = pruneEnvMap(env, { removeWhitespaceOnly: false });
    expect(pruned.has("A")).toBe(true);
    expect(pruned.has("B")).toBe(false);
  });

  it("removes only specified keys when keys option is provided", () => {
    const env = makeMap({ A: "alpha", B: "beta", C: "gamma" });
    const { pruned, removedKeys } = pruneEnvMap(env, { keys: ["B"] });
    expect(pruned.has("A")).toBe(true);
    expect(pruned.has("C")).toBe(true);
    expect(pruned.has("B")).toBe(false);
    expect(removedKeys).toEqual(["B"]);
  });

  it("returns correct counts", () => {
    const env = makeMap({ A: "", B: "", C: "keep" });
    const result = pruneEnvMap(env);
    expect(result.originalCount).toBe(3);
    expect(result.prunedCount).toBe(2);
  });

  it("returns empty removedKeys when nothing is pruned", () => {
    const env = makeMap({ A: "a", B: "b" });
    const { removedKeys } = pruneEnvMap(env);
    expect(removedKeys).toHaveLength(0);
  });
});

describe("formatPruneSummary", () => {
  it("returns no-op message when nothing pruned", () => {
    const env = makeMap({ A: "val" });
    const result = pruneEnvMap(env);
    expect(formatPruneSummary(result)).toBe("No keys pruned.");
  });

  it("lists removed keys in summary", () => {
    const env = makeMap({ A: "", B: "keep" });
    const result = pruneEnvMap(env);
    const summary = formatPruneSummary(result);
    expect(summary).toContain("Pruned 1 of 2 keys");
    expect(summary).toContain("- A");
  });
});
