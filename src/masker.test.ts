import { describe, it, expect } from "bun:test";
import {
  maskValue,
  maskEnvMap,
  maskRecord,
  formatMasked,
} from "./masker";

function makeMap(entries: Record<string, string>): Map<string, string> {
  return new Map(Object.entries(entries));
}

describe("maskValue", () => {
  it("partial mode shows last 4 chars by default", () => {
    expect(maskValue("supersecret")).toBe("*******cret");
  });

  it("partial mode with short value masks all", () => {
    expect(maskValue("abc")).toBe("***");
  });

  it("full mode masks entire value", () => {
    expect(maskValue("hello", { mode: "full" })).toBe("*****");
  });

  it("length mode returns fixed 8 stars", () => {
    expect(maskValue("anyvalue", { mode: "length" })).toBe("********");
    expect(maskValue("x", { mode: "length" })).toBe("********");
  });

  it("respects custom char", () => {
    expect(maskValue("hello", { mode: "full", char: "#" })).toBe("#####");
  });

  it("respects custom visibleChars", () => {
    expect(maskValue("abcdefgh", { visibleChars: 2 })).toBe("******gh");
  });

  it("returns empty string unchanged", () => {
    expect(maskValue("")).toBe("");
  });
});

describe("maskEnvMap", () => {
  it("masks all values in map", () => {
    const env = makeMap({ DB_PASS: "secret1234", API_KEY: "abcdefgh" });
    const masked = maskEnvMap(env);
    expect(masked.get("DB_PASS")).toBe("******1234");
    expect(masked.get("API_KEY")).toBe("****efgh");
  });

  it("does not mutate original map", () => {
    const env = makeMap({ TOKEN: "mytoken" });
    maskEnvMap(env, { mode: "full" });
    expect(env.get("TOKEN")).toBe("mytoken");
  });
});

describe("maskRecord", () => {
  it("masks all values in record", () => {
    const rec = { SECRET: "password", NAME: "alice" };
    const masked = maskRecord(rec, { mode: "full" });
    expect(masked.SECRET).toBe("********");
    expect(masked.NAME).toBe("*****");
  });
});

describe("formatMasked", () => {
  it("formats masked map as dotenv lines", () => {
    const env = makeMap({ FOO: "bar123", BAZ: "qux" });
    const output = formatMasked(env, { mode: "full" });
    expect(output).toContain("FOO=******");
    expect(output).toContain("BAZ=***");
  });
});
