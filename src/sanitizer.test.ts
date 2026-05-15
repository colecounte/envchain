import { describe, it, expect } from "vitest";
import { sanitizeValue, sanitizeEnvMap, formatSanitizeSummary } from "./sanitizer";

function makeMap(obj: Record<string, string>): Map<string, string> {
  return new Map(Object.entries(obj));
}

describe("sanitizeValue", () => {
  it("trims whitespace by default", () => {
    expect(sanitizeValue("  hello  ")).toBe("hello");
  });

  it("removes null bytes by default", () => {
    expect(sanitizeValue("hel\0lo")).toBe("hello");
  });

  it("normalizes CRLF to LF", () => {
    expect(sanitizeValue("line1\r\nline2")).toBe("line1\nline2");
  });

  it("normalizes bare CR to LF", () => {
    expect(sanitizeValue("line1\rline2")).toBe("line1\nline2");
  });

  it("truncates to maxLength", () => {
    const long = "a".repeat(10);
    expect(sanitizeValue(long, { maxLength: 5 })).toBe("aaaaa");
  });

  it("respects disabled options", () => {
    expect(sanitizeValue("  hi  ", { trimWhitespace: false })).toBe("  hi  ");
    expect(sanitizeValue("a\0b", { removeNullBytes: false })).toBe("a\0b");
  });

  it("returns empty string unchanged", () => {
    expect(sanitizeValue("")).toBe("");
  });
});

describe("sanitizeEnvMap", () => {
  it("normalizes keys to uppercase with underscores", () => {
    const input = makeMap({ "my key": "value" });
    const result = sanitizeEnvMap(input);
    expect(result.has("MY_KEY")).toBe(true);
    expect(result.get("MY_KEY")).toBe("value");
  });

  it("sanitizes values", () => {
    const input = makeMap({ API_KEY: "  secret  " });
    const result = sanitizeEnvMap(input);
    expect(result.get("API_KEY")).toBe("secret");
  });

  it("drops keys that become empty after trim", () => {
    const input = makeMap({ "   ": "value" });
    const result = sanitizeEnvMap(input);
    expect(result.size).toBe(0);
  });

  it("handles multiple entries", () => {
    const input = makeMap({ DB_HOST: " localhost ", DB_PORT: " 5432 " });
    const result = sanitizeEnvMap(input);
    expect(result.get("DB_HOST")).toBe("localhost");
    expect(result.get("DB_PORT")).toBe("5432");
  });
});

describe("formatSanitizeSummary", () => {
  it("reports no changes when values are identical", () => {
    const m = makeMap({ KEY: "value" });
    expect(formatSanitizeSummary(m, m)).toBe("No changes during sanitization.");
  });

  it("reports changed values", () => {
    const original = makeMap({ KEY: "  value  " });
    const sanitized = makeMap({ KEY: "value" });
    const summary = formatSanitizeSummary(original, sanitized);
    expect(summary).toContain("KEY");
    expect(summary).toContain("1 value(s)");
  });
});
