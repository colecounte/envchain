import { describe, it, expect } from "bun:test";
import {
  createPinMap,
  applyPins,
  addPin,
  removePin,
  pinRecordToMap,
  listPins,
  formatPinSummary,
} from "./pinner";

const makeMap = (obj: Record<string, string>) => new Map(Object.entries(obj));

describe("createPinMap", () => {
  it("creates a map from a plain record", () => {
    const pm = createPinMap({ FOO: "bar", BAZ: "qux" });
    expect(pm.get("FOO")).toBe("bar");
    expect(pm.get("BAZ")).toBe("qux");
  });
});

describe("applyPins", () => {
  it("overrides env values with pinned values", () => {
    const env = makeMap({ FOO: "original", OTHER: "keep" });
    const pins = createPinMap({ FOO: "pinned" });
    const result = applyPins(env, pins);
    expect(result.get("FOO")).toBe("pinned");
    expect(result.get("OTHER")).toBe("keep");
  });

  it("adds pinned keys not in original env", () => {
    const env = makeMap({ A: "1" });
    const pins = createPinMap({ B: "2" });
    const result = applyPins(env, pins);
    expect(result.get("B")).toBe("2");
  });

  it("does not mutate the original env map", () => {
    const env = makeMap({ FOO: "original" });
    const pins = createPinMap({ FOO: "pinned" });
    applyPins(env, pins);
    expect(env.get("FOO")).toBe("original");
  });
});

describe("addPin / removePin", () => {
  it("adds a pin entry with timestamp", () => {
    const record = addPin({}, "API_KEY", "secret");
    expect(record["API_KEY"].value).toBe("secret");
    expect(record["API_KEY"].key).toBe("API_KEY");
    expect(record["API_KEY"].pinnedAt).toBeTruthy();
  });

  it("removes a pin entry", () => {
    let record = addPin({}, "API_KEY", "secret");
    record = removePin(record, "API_KEY");
    expect(record["API_KEY"]).toBeUndefined();
  });

  it("removePin is a no-op for missing keys", () => {
    const record = removePin({}, "MISSING");
    expect(Object.keys(record)).toHaveLength(0);
  });
});

describe("pinRecordToMap", () => {
  it("converts a PinRecord to a PinMap", () => {
    const record = addPin(addPin({}, "X", "1"), "Y", "2");
    const map = pinRecordToMap(record);
    expect(map.get("X")).toBe("1");
    expect(map.get("Y")).toBe("2");
  });
});

describe("listPins", () => {
  it("returns entries sorted by key", () => {
    const record = addPin(addPin(addPin({}, "C", "3"), "A", "1"), "B", "2");
    const list = listPins(record);
    expect(list.map((e) => e.key)).toEqual(["A", "B", "C"]);
  });
});

describe("formatPinSummary", () => {
  it("returns a message when no pins", () => {
    expect(formatPinSummary({})).toBe("No pinned keys.");
  });

  it("includes key and value in summary", () => {
    const record = addPin({}, "DB_URL", "postgres://localhost");
    const summary = formatPinSummary(record);
    expect(summary).toContain("DB_URL");
    expect(summary).toContain("postgres://localhost");
  });
});
