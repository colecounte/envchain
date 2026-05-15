import { describe, it, expect } from "bun:test";
import {
  groupByPrefix,
  groupByPattern,
  flattenGroups,
  formatGroups,
} from "./grouper";

function makeMap(obj: Record<string, string>): Map<string, string> {
  return new Map(Object.entries(obj));
}

describe("groupByPrefix", () => {
  it("groups keys by first segment before separator", () => {
    const env = makeMap({ DB_HOST: "localhost", DB_PORT: "5432", APP_NAME: "myapp", SECRET: "x" });
    const groups = groupByPrefix(env);
    expect(groups.get("DB")?.get("DB_HOST")).toBe("localhost");
    expect(groups.get("DB")?.get("DB_PORT")).toBe("5432");
    expect(groups.get("APP")?.get("APP_NAME")).toBe("myapp");
    expect(groups.get("__ungrouped__")?.get("SECRET")).toBe("x");
  });

  it("uses custom separator", () => {
    const env = makeMap({ "DB.HOST": "localhost", "DB.PORT": "5432" });
    const groups = groupByPrefix(env, ".");
    expect(groups.get("DB")?.size).toBe(2);
  });

  it("returns empty map for empty input", () => {
    expect(groupByPrefix(new Map()).size).toBe(0);
  });
});

describe("groupByPattern", () => {
  it("groups by regex patterns", () => {
    const env = makeMap({ DB_HOST: "localhost", AWS_KEY: "key", AWS_SECRET: "sec", PORT: "3000" });
    const groups = groupByPattern(env, { db: /^DB_/, aws: /^AWS_/ });
    expect(groups.get("db")?.has("DB_HOST")).toBe(true);
    expect(groups.get("aws")?.size).toBe(2);
    expect(groups.get("__ungrouped__")?.has("PORT")).toBe(true);
  });

  it("omits empty pattern groups", () => {
    const env = makeMap({ PORT: "3000" });
    const groups = groupByPattern(env, { db: /^DB_/ });
    expect(groups.has("db")).toBe(false);
  });
});

describe("flattenGroups", () => {
  it("merges all groups into a single map", () => {
    const env = makeMap({ DB_HOST: "localhost", APP_NAME: "myapp" });
    const groups = groupByPrefix(env);
    const flat = flattenGroups(groups);
    expect(flat.get("DB_HOST")).toBe("localhost");
    expect(flat.get("APP_NAME")).toBe("myapp");
  });
});

describe("formatGroups", () => {
  it("formats groups as labeled sections", () => {
    const env = makeMap({ DB_HOST: "localhost" });
    const groups = groupByPrefix(env);
    const output = formatGroups(groups);
    expect(output).toContain("[DB]");
    expect(output).toContain("DB_HOST=localhost");
  });
});
