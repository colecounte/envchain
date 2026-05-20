import { describe, it, expect } from "vitest";
import { cloneEnvMap, formatCloneResult } from "./cloner";
import { EnvMap } from "./merger";

function makeMap(entries: Record<string, string>): EnvMap {
  return { ...entries };
}

describe("cloneEnvMap", () => {
  it("clones all keys from source into empty target", () => {
    const source = makeMap({ FOO: "1", BAR: "2" });
    const { cloned, added, skipped } = cloneEnvMap(source, {});
    expect(cloned).toEqual({ FOO: "1", BAR: "2" });
    expect(added).toEqual(["FOO", "BAR"]);
    expect(skipped).toHaveLength(0);
  });

  it("applies prefix to cloned keys", () => {
    const source = makeMap({ NAME: "alice" });
    const { cloned, added } = cloneEnvMap(source, {}, { prefix: "APP_" });
    expect(cloned).toHaveProperty("APP_NAME", "alice");
    expect(added).toContain("APP_NAME");
  });

  it("applies suffix to cloned keys", () => {
    const source = makeMap({ HOST: "localhost" });
    const { cloned } = cloneEnvMap(source, {}, { suffix: "_BACKUP" });
    expect(cloned).toHaveProperty("HOST_BACKUP", "localhost");
  });

  it("skips existing keys without overwrite", () => {
    const source = makeMap({ FOO: "new" });
    const target = makeMap({ FOO: "old" });
    const { cloned, skipped } = cloneEnvMap(source, target);
    expect(cloned["FOO"]).toBe("old");
    expect(skipped).toContain("FOO");
  });

  it("overwrites existing keys when overwrite=true", () => {
    const source = makeMap({ FOO: "new" });
    const target = makeMap({ FOO: "old" });
    const { cloned, added } = cloneEnvMap(source, target, { overwrite: true });
    expect(cloned["FOO"]).toBe("new");
    expect(added).toContain("FOO");
  });

  it("clones only specified keys", () => {
    const source = makeMap({ A: "1", B: "2", C: "3" });
    const { cloned, added } = cloneEnvMap(source, {}, { keys: ["A", "C"] });
    expect(cloned).toEqual({ A: "1", C: "3" });
    expect(added).toEqual(["A", "C"]);
  });

  it("ignores keys listed in keys filter that are absent in source", () => {
    const source = makeMap({ A: "1" });
    const { cloned, added } = cloneEnvMap(source, {}, { keys: ["A", "MISSING"] });
    expect(Object.keys(cloned)).toEqual(["A"]);
    expect(added).toEqual(["A"]);
  });
});

describe("formatCloneResult", () => {
  it("reports cloned and skipped keys", () => {
    const result = { cloned: {}, added: ["FOO", "BAR"], skipped: ["BAZ"] };
    const out = formatCloneResult(result);
    expect(out).toContain("Cloned 2");
    expect(out).toContain("Skipped 1");
  });

  it("reports nothing when result is empty", () => {
    const out = formatCloneResult({ cloned: {}, added: [], skipped: [] });
    expect(out).toBe("Nothing cloned.");
  });
});
