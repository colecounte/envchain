import { describe, it, expect } from "vitest";
import { sortEnvMap, groupEnvByPrefix, sortAndGroup } from "./sorter";

function makeMap(entries: Record<string, string>): Map<string, string> {
  return new Map(Object.entries(entries));
}

describe("sortEnvMap", () => {
  it("sorts keys ascending by default", () => {
    const env = makeMap({ ZEBRA: "z", APPLE: "a", MANGO: "m" });
    const sorted = sortEnvMap(env);
    expect([...sorted.keys()]).toEqual(["APPLE", "MANGO", "ZEBRA"]);
  });

  it("sorts keys descending", () => {
    const env = makeMap({ ZEBRA: "z", APPLE: "a", MANGO: "m" });
    const sorted = sortEnvMap(env, "desc");
    expect([...sorted.keys()]).toEqual(["ZEBRA", "MANGO", "APPLE"]);
  });

  it("preserves values after sort", () => {
    const env = makeMap({ B: "2", A: "1" });
    const sorted = sortEnvMap(env);
    expect(sorted.get("A")).toBe("1");
    expect(sorted.get("B")).toBe("2");
  });

  it("handles empty map", () => {
    expect(sortEnvMap(new Map()).size).toBe(0);
  });
});

describe("groupEnvByPrefix", () => {
  it("groups keys by prefix", () => {
    const env = makeMap({ DB_HOST: "localhost", DB_PORT: "5432", APP_NAME: "test" });
    const groups = groupEnvByPrefix(env);
    expect(groups.has("DB")).toBe(true);
    expect(groups.has("APP")).toBe(true);
    expect(groups.get("DB")?.get("DB_HOST")).toBe("localhost");
  });

  it("puts keys without delimiter in __ungrouped__", () => {
    const env = makeMap({ NOPREFIX: "val", DB_HOST: "h" });
    const groups = groupEnvByPrefix(env);
    expect(groups.has("__ungrouped__")).toBe(true);
    expect(groups.get("__ungrouped__")?.get("NOPREFIX")).toBe("val");
  });

  it("supports custom delimiter", () => {
    const env = makeMap({ "NS.KEY": "v" });
    const groups = groupEnvByPrefix(env, ".");
    expect(groups.has("NS")).toBe(true);
  });
});

describe("sortAndGroup", () => {
  it("returns sorted map when groupByPrefix is false", () => {
    const env = makeMap({ Z: "z", A: "a" });
    const result = sortAndGroup(env) as Map<string, string>;
    expect([...result.keys()][0]).toBe("A");
  });

  it("returns grouped map when groupByPrefix is true", () => {
    const env = makeMap({ DB_HOST: "h", APP_NAME: "n" });
    const result = sortAndGroup(env, { groupByPrefix: true }) as Map<string, Map<string, string>>;
    expect(result instanceof Map).toBe(true);
    expect(result.has("DB")).toBe(true);
  });
});
