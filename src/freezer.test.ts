import { describe, it, expect } from "bun:test";
import {
  freezeEnvMap,
  isFrozen,
  createFreezeRecord,
  detectDrift,
  hasDrift,
  formatDrift,
} from "./freezer";

const makeMap = (entries: Record<string, string>) => ({ ...entries });

describe("freezeEnvMap", () => {
  it("returns a frozen object", () => {
    const frozen = freezeEnvMap(makeMap({ FOO: "bar" }));
    expect(Object.isFrozen(frozen)).toBe(true);
  });

  it("preserves all keys", () => {
    const frozen = freezeEnvMap(makeMap({ A: "1", B: "2" }));
    expect(frozen.A).toBe("1");
    expect(frozen.B).toBe("2");
  });
});

describe("isFrozen", () => {
  it("returns true for frozen maps", () => {
    const frozen = freezeEnvMap(makeMap({ X: "y" }));
    expect(isFrozen(frozen)).toBe(true);
  });

  it("returns false for plain objects", () => {
    expect(isFrozen(makeMap({ X: "y" }))).toBe(false);
  });
});

describe("createFreezeRecord", () => {
  it("includes frozenAt, context, and frozen map", () => {
    const record = createFreezeRecord({ FOO: "bar" }, "production");
    expect(record.context).toBe("production");
    expect(record.map.FOO).toBe("bar");
    expect(typeof record.frozenAt).toBe("string");
    expect(Object.isFrozen(record.map)).toBe(true);
  });

  it("defaults context to 'default'", () => {
    const record = createFreezeRecord({ A: "1" });
    expect(record.context).toBe("default");
  });
});

describe("detectDrift", () => {
  it("detects changed values", () => {
    const frozen = freezeEnvMap({ FOO: "old" });
    const drift = detectDrift(frozen, { FOO: "new" });
    expect(drift["FOO"]).toEqual({ frozen: "old", current: "new" });
  });

  it("detects added keys", () => {
    const frozen = freezeEnvMap({});
    const drift = detectDrift(frozen, { NEW_KEY: "val" });
    expect(drift["NEW_KEY"]).toEqual({ frozen: undefined, current: "val" });
  });

  it("detects removed keys", () => {
    const frozen = freezeEnvMap({ GONE: "bye" });
    const drift = detectDrift(frozen, {});
    expect(drift["GONE"]).toEqual({ frozen: "bye", current: undefined });
  });

  it("returns empty when no drift", () => {
    const frozen = freezeEnvMap({ A: "1" });
    expect(detectDrift(frozen, { A: "1" })).toEqual({});
  });
});

describe("hasDrift", () => {
  it("returns true when drift exists", () => {
    expect(hasDrift(freezeEnvMap({ A: "1" }), { A: "2" })).toBe(true);
  });

  it("returns false when no drift", () => {
    expect(hasDrift(freezeEnvMap({ A: "1" }), { A: "1" })).toBe(false);
  });
});

describe("formatDrift", () => {
  it("formats changed, added, removed entries", () => {
    const output = formatDrift({
      FOO: { frozen: "old", current: "new" },
      BAR: { frozen: undefined, current: "added" },
      BAZ: { frozen: "removed", current: undefined },
    });
    expect(output).toContain("~ FOO");
    expect(output).toContain("+ BAR");
    expect(output).toContain("- BAZ");
  });
});
