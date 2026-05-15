import { describe, it, expect } from "bun:test";
import {
  matchesRule,
  applyTransformRule,
  transformEnvMap,
  upperCase,
  lowerCase,
  trim,
  base64Encode,
  base64Decode,
  resolveTransformFn,
} from "./transformer";

function makeMap(obj: Record<string, string>): Map<string, string> {
  return new Map(Object.entries(obj));
}

describe("matchesRule", () => {
  it("matches exact string key", () => {
    expect(matchesRule("FOO", "FOO")).toBe(true);
    expect(matchesRule("BAR", "FOO")).toBe(false);
  });

  it("matches prefix string", () => {
    expect(matchesRule("DB_HOST", "DB_")).toBe(true);
    expect(matchesRule("APP_KEY", "DB_")).toBe(false);
  });

  it("matches regex pattern", () => {
    expect(matchesRule("SECRET_KEY", /SECRET/)).toBe(true);
    expect(matchesRule("PUBLIC_URL", /SECRET/)).toBe(false);
  });
});

describe("applyTransformRule", () => {
  it("transforms matching keys only", () => {
    const map = makeMap({ FOO: "hello", BAR: "world" });
    const result = applyTransformRule(map, { pattern: "FOO", transform: upperCase });
    expect(result.get("FOO")).toBe("HELLO");
    expect(result.get("BAR")).toBe("world");
  });

  it("applies regex pattern", () => {
    const map = makeMap({ DB_HOST: "localhost", DB_PORT: "5432", APP: "x" });
    const result = applyTransformRule(map, { pattern: /^DB_/, transform: upperCase });
    expect(result.get("DB_HOST")).toBe("LOCALHOST");
    expect(result.get("DB_PORT")).toBe("5432");
    expect(result.get("APP")).toBe("x");
  });
});

describe("transformEnvMap", () => {
  it("applies multiple rules in order", () => {
    const map = makeMap({ KEY: "  hello  " });
    const result = transformEnvMap(map, [
      { pattern: "KEY", transform: trim },
      { pattern: "KEY", transform: upperCase },
    ]);
    expect(result.get("KEY")).toBe("HELLO");
  });
});

describe("built-in transforms", () => {
  it("lowerCase", () => expect(lowerCase("HELLO", "K")).toBe("hello"));
  it("base64 round-trip", () => {
    const encoded = base64Encode("secret", "K");
    expect(base64Decode(encoded, "K")).toBe("secret");
  });
});

describe("resolveTransformFn", () => {
  it("returns builtin by name", () => {
    expect(resolveTransformFn("upper")).toBeDefined();
    expect(resolveTransformFn("LOWER")).toBeDefined();
  });

  it("returns undefined for unknown", () => {
    expect(resolveTransformFn("nonexistent")).toBeUndefined();
  });
});
