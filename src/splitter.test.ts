import { describe, it, expect } from "vitest";
import {
  splitByPrefix,
  splitByPattern,
  formatSplitResult,
  EnvMap,
} from "./splitter";

function makeMap(obj: Record<string, string>): EnvMap {
  return new Map(Object.entries(obj));
}

describe("splitByPrefix", () => {
  it("splits keys into groups by prefix", () => {
    const env = makeMap({
      DB_HOST: "localhost",
      DB_PORT: "5432",
      APP_NAME: "myapp",
      APP_ENV: "dev",
      OTHER: "value",
    });
    const { groups, unmatched } = splitByPrefix(env, ["DB", "APP"]);
    expect(groups["DB"].get("HOST")).toBe("localhost");
    expect(groups["DB"].get("PORT")).toBe("5432");
    expect(groups["APP"].get("NAME")).toBe("myapp");
    expect(groups["APP"].get("ENV")).toBe("dev");
    expect(unmatched.get("OTHER")).toBe("value");
  });

  it("places unmatched keys in unmatched map", () => {
    const env = makeMap({ FOO: "bar", BAZ: "qux" });
    const { unmatched } = splitByPrefix(env, ["DB"]);
    expect(unmatched.size).toBe(2);
  });

  it("handles empty env map", () => {
    const { groups, unmatched } = splitByPrefix(new Map(), ["DB"]);
    expect(groups["DB"].size).toBe(0);
    expect(unmatched.size).toBe(0);
  });

  it("handles exact prefix match without underscore", () => {
    const env = makeMap({ DB: "sqlite" });
    const { groups } = splitByPrefix(env, ["DB"]);
    expect(groups["DB"].get("DB")).toBe("sqlite");
  });
});

describe("splitByPattern", () => {
  it("splits keys by regex patterns", () => {
    const env = makeMap({
      SECRET_KEY: "abc",
      SECRET_TOKEN: "xyz",
      PORT: "3000",
      HOST: "localhost",
    });
    const { groups, unmatched } = splitByPattern(env, {
      secrets: /^SECRET_/,
      network: /^(PORT|HOST)$/,
    });
    expect(groups["secrets"].size).toBe(2);
    expect(groups["network"].size).toBe(2);
    expect(unmatched.size).toBe(0);
  });

  it("puts non-matching keys in unmatched", () => {
    const env = makeMap({ UNKNOWN: "val" });
    const { unmatched } = splitByPattern(env, { secrets: /^SECRET_/ });
    expect(unmatched.get("UNKNOWN")).toBe("val");
  });
});

describe("formatSplitResult", () => {
  it("formats groups and unmatched", () => {
    const env = makeMap({ DB_HOST: "localhost", OTHER: "val" });
    const result = splitByPrefix(env, ["DB"]);
    const output = formatSplitResult(result);
    expect(output).toContain("[DB]");
    expect(output).toContain("HOST=localhost");
    expect(output).toContain("[unmatched]");
    expect(output).toContain("OTHER=val");
  });
});
