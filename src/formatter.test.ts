import { describe, it, expect } from "vitest";
import {
  formatDotenv,
  formatExport,
  formatJson,
  formatCsv,
  formatEnvMap,
} from "./formatter";

function makeMap(entries: Record<string, string>): Map<string, string> {
  return new Map(Object.entries(entries));
}

describe("formatDotenv", () => {
  it("formats simple key=value pairs", () => {
    const result = formatDotenv(makeMap({ FOO: "bar", BAZ: "qux" }));
    expect(result).toBe("FOO=bar\nBAZ=qux\n");
  });

  it("quotes values containing newlines", () => {
    const result = formatDotenv(makeMap({ MSG: "hello\nworld" }));
    expect(result).toContain('"hello\nworld"');
  });

  it("returns empty string for empty map", () => {
    expect(formatDotenv(new Map())).toBe("");
  });
});

describe("formatExport", () => {
  it("wraps values in single quotes with export prefix", () => {
    const result = formatExport(makeMap({ HOME: "/home/user" }));
    expect(result).toBe("export HOME='/home/user'\n");
  });

  it("escapes single quotes in values", () => {
    const result = formatExport(makeMap({ GREETING: "it's alive" }));
    expect(result).toContain("it'\\''s alive");
  });
});

describe("formatJson", () => {
  it("produces valid JSON", () => {
    const result = formatJson(makeMap({ KEY: "value" }));
    const parsed = JSON.parse(result);
    expect(parsed).toEqual({ KEY: "value" });
  });

  it("returns empty object JSON for empty map", () => {
    const result = formatJson(new Map());
    expect(JSON.parse(result)).toEqual({});
  });
});

describe("formatCsv", () => {
  it("includes header row", () => {
    const result = formatCsv(makeMap({ A: "1" }));
    expect(result.startsWith("key,value\n")).toBe(true);
  });

  it("quotes values containing commas", () => {
    const result = formatCsv(makeMap({ LIST: "a,b,c" }));
    expect(result).toContain('"a,b,c"');
  });
});

describe("formatEnvMap", () => {
  it("dispatches to dotenv format", () => {
    const result = formatEnvMap(makeMap({ X: "1" }), "dotenv");
    expect(result).toBe("X=1\n");
  });

  it("throws on unknown format", () => {
    // @ts-expect-error testing invalid input
    expect(() => formatEnvMap(new Map(), "xml")).toThrow("Unknown output format");
  });
});
