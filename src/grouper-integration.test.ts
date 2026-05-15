import { describe, it, expect } from "bun:test";
import { groupByPrefix, groupByPattern, flattenGroups } from "./grouper";
import { mergeEnvMaps } from "./merger";
import { filterByPrefix } from "./filter";

function makeMap(obj: Record<string, string>): Map<string, string> {
  return new Map(Object.entries(obj));
}

describe("grouper integration", () => {
  it("round-trips through groupByPrefix and flattenGroups", () => {
    const env = makeMap({
      DB_HOST: "localhost",
      DB_PORT: "5432",
      APP_NAME: "envchain",
      APP_ENV: "test",
    });
    const groups = groupByPrefix(env);
    const flat = flattenGroups(groups);
    expect(flat.size).toBe(env.size);
    for (const [k, v] of env) {
      expect(flat.get(k)).toBe(v);
    }
  });

  it("groups then filters a specific prefix", () => {
    const env = makeMap({
      DB_HOST: "localhost",
      DB_PORT: "5432",
      APP_NAME: "envchain",
    });
    const groups = groupByPrefix(env);
    const dbGroup = groups.get("DB") ?? new Map();
    expect(dbGroup.size).toBe(2);
    const filtered = filterByPrefix(dbGroup, "DB_");
    expect(filtered.size).toBe(2);
  });

  it("merges two env maps then groups result", () => {
    const base = makeMap({ DB_HOST: "localhost", APP_NAME: "base" });
    const override = makeMap({ DB_HOST: "prod-db", REDIS_URL: "redis://localhost" });
    const merged = mergeEnvMaps([base, override], "override");
    const groups = groupByPrefix(merged);
    expect(groups.get("DB")?.get("DB_HOST")).toBe("prod-db");
    expect(groups.get("APP")?.get("APP_NAME")).toBe("base");
    expect(groups.get("REDIS")?.get("REDIS_URL")).toBe("redis://localhost");
  });

  it("groupByPattern handles overlapping patterns by first match", () => {
    const env = makeMap({ DB_HOST: "localhost", DB_REPLICA_HOST: "replica" });
    const groups = groupByPattern(env, { db: /^DB_/, replica: /^DB_REPLICA_/ });
    // Both matched by db pattern first since iteration order
    expect(groups.get("db")?.size).toBeGreaterThan(0);
  });
});
