import { describe, it, expect } from "bun:test";
import {
  applyRenames,
  prefixKeys,
  suffixKeys,
  stripPrefix,
  renameEnvMap,
} from "./renamer";

function makeMap(obj: Record<string, string>): Map<string, string> {
  return new Map(Object.entries(obj));
}

describe("applyRenames", () => {
  it("renames specified keys", () => {
    const env = makeMap({ FOO: "1", BAR: "2", BAZ: "3" });
    const result = applyRenames(env, { FOO: "FOO_NEW", BAR: "BAR_NEW" });
    expect(result.get("FOO_NEW")).toBe("1");
    expect(result.get("BAR_NEW")).toBe("2");
    expect(result.get("BAZ")).toBe("3");
    expect(result.has("FOO")).toBe(false);
  });

  it("leaves unspecified keys unchanged", () => {
    const env = makeMap({ A: "x" });
    const result = applyRenames(env, {});
    expect(result.get("A")).toBe("x");
  });
});

describe("prefixKeys", () => {
  it("adds prefix to all keys", () => {
    const env = makeMap({ HOST: "localhost", PORT: "3000" });
    const result = prefixKeys(env, "APP_");
    expect(result.get("APP_HOST")).toBe("localhost");
    expect(result.get("APP_PORT")).toBe("3000");
    expect(result.has("HOST")).toBe(false);
  });
});

describe("suffixKeys", () => {
  it("adds suffix to all keys", () => {
    const env = makeMap({ DB: "postgres" });
    const result = suffixKeys(env, "_URL");
    expect(result.get("DB_URL")).toBe("postgres");
    expect(result.has("DB")).toBe(false);
  });
});

describe("stripPrefix", () => {
  it("strips matching prefix", () => {
    const env = makeMap({ APP_HOST: "localhost", APP_PORT: "3000", OTHER: "x" });
    const result = stripPrefix(env, "APP_");
    expect(result.get("HOST")).toBe("localhost");
    expect(result.get("PORT")).toBe("3000");
    expect(result.get("OTHER")).toBe("x");
  });

  it("leaves keys without prefix unchanged", () => {
    const env = makeMap({ FOO: "bar" });
    const result = stripPrefix(env, "NOPE_");
    expect(result.get("FOO")).toBe("bar");
  });
});

describe("renameEnvMap", () => {
  it("applies strip then prefix", () => {
    const env = makeMap({ OLD_KEY: "val" });
    const result = renameEnvMap(env, { strip: "OLD_", prefix: "NEW_" });
    expect(result.get("NEW_KEY")).toBe("val");
  });

  it("applies all options in order", () => {
    const env = makeMap({ SRC_FOO: "1", SRC_BAR: "2" });
    const result = renameEnvMap(env, {
      strip: "SRC_",
      renames: { FOO: "FOOBAR" },
      prefix: "APP_",
      suffix: "_VAR",
    });
    expect(result.get("APP_FOOBAR_VAR")).toBe("1");
    expect(result.get("APP_BAR_VAR")).toBe("2");
  });

  it("returns unchanged map when no options given", () => {
    const env = makeMap({ X: "1" });
    const result = renameEnvMap(env, {});
    expect(result.get("X")).toBe("1");
  });
});
