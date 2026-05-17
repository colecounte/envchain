import { describe, it, expect, beforeEach } from "vitest";
import { injectEnvMap, formatInjectResult, InjectResult } from "./injector";

function makeMap(obj: Record<string, string>) {
  return obj;
}

describe("injectEnvMap", () => {
  let target: NodeJS.ProcessEnv;

  beforeEach(() => {
    target = {};
  });

  it("injects all keys into empty target", () => {
    const map = makeMap({ FOO: "bar", BAZ: "qux" });
    const result = injectEnvMap(map, target);
    expect(target["FOO"]).toBe("bar");
    expect(target["BAZ"]).toBe("qux");
    expect(result.injected).toEqual(["FOO", "BAZ"]);
    expect(result.skipped).toHaveLength(0);
    expect(result.overridden).toHaveLength(0);
  });

  it("skips existing keys when override is false", () => {
    target["FOO"] = "existing";
    const map = makeMap({ FOO: "new", BAR: "val" });
    const result = injectEnvMap(map, target, { override: false });
    expect(target["FOO"]).toBe("existing");
    expect(result.skipped).toContain("FOO");
    expect(result.injected).toContain("BAR");
  });

  it("overrides existing keys when override is true", () => {
    target["FOO"] = "old";
    const map = makeMap({ FOO: "new" });
    const result = injectEnvMap(map, target, { override: true });
    expect(target["FOO"]).toBe("new");
    expect(result.overridden).toContain("FOO");
  });

  it("applies prefix to keys", () => {
    const map = makeMap({ KEY: "value" });
    injectEnvMap(map, target, { prefix: "APP_" });
    expect(target["APP_KEY"]).toBe("value");
    expect(target["KEY"]).toBeUndefined();
  });

  it("does not mutate target in dryRun mode", () => {
    const map = makeMap({ DRY: "run" });
    const result = injectEnvMap(map, target, { dryRun: true });
    expect(target["DRY"]).toBeUndefined();
    expect(result.injected).toContain("DRY");
  });
});

describe("formatInjectResult", () => {
  it("formats all categories", () => {
    const result: InjectResult = {
      injected: ["A"],
      overridden: ["B"],
      skipped: ["C"],
    };
    const output = formatInjectResult(result);
    expect(output).toContain("Injected: A");
    expect(output).toContain("Overridden: B");
    expect(output).toContain("Skipped (already set): C");
  });

  it("omits empty categories", () => {
    const result: InjectResult = { injected: ["X"], overridden: [], skipped: [] };
    const output = formatInjectResult(result);
    expect(output).not.toContain("Overridden");
    expect(output).not.toContain("Skipped");
  });
});
