import { describe, it, expect } from "vitest";
import { parseAliasArgs, applyAliases, formatAliasSummary } from "./aliaser";

const makeMap = (obj: Record<string, string>) => ({ ...obj });

describe("parseAliasArgs", () => {
  it("parses valid alias specs", () => {
    expect(parseAliasArgs(["DB_URL=DATABASE_URL", "PORT=APP_PORT"])).toEqual({
      DB_URL: "DATABASE_URL",
      PORT: "APP_PORT",
    });
  });

  it("throws on missing equals sign", () => {
    expect(() => parseAliasArgs(["NOEQ"])).toThrow("Invalid alias spec");
  });

  it("throws on empty alias", () => {
    expect(() => parseAliasArgs(["=ORIGINAL"])).toThrow();
  });
});

describe("applyAliases", () => {
  it("adds alias keys for present originals", () => {
    const env = makeMap({ DATABASE_URL: "postgres://localhost/db", SECRET: "abc" });
    const result = applyAliases(env, { DB_URL: "DATABASE_URL" });
    expect(result["DB_URL"]).toBe("postgres://localhost/db");
    expect(result["DATABASE_URL"]).toBe("postgres://localhost/db");
  });

  it("does not add alias when original is missing", () => {
    const env = makeMap({ SECRET: "abc" });
    const result = applyAliases(env, { DB_URL: "DATABASE_URL" });
    expect(result["DB_URL"]).toBeUndefined();
  });

  it("removes original when removeOriginal=true", () => {
    const env = makeMap({ DATABASE_URL: "postgres://localhost/db" });
    const result = applyAliases(env, { DB_URL: "DATABASE_URL" }, true);
    expect(result["DB_URL"]).toBe("postgres://localhost/db");
    expect(result["DATABASE_URL"]).toBeUndefined();
  });

  it("preserves unrelated keys", () => {
    const env = makeMap({ FOO: "bar", DATABASE_URL: "x" });
    const result = applyAliases(env, { DB: "DATABASE_URL" });
    expect(result["FOO"]).toBe("bar");
  });
});

describe("formatAliasSummary", () => {
  it("marks resolved aliases as ok", () => {
    const env = makeMap({ DATABASE_URL: "x" });
    const summary = formatAliasSummary(env, { DB_URL: "DATABASE_URL" });
    expect(summary).toContain("(ok)");
  });

  it("marks missing originals", () => {
    const env = makeMap({});
    const summary = formatAliasSummary(env, { DB_URL: "DATABASE_URL" });
    expect(summary).toContain("(missing)");
  });
});
