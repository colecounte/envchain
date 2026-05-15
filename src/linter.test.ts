import { describe, it, expect } from "vitest";
import { lintEnvMap, formatLintIssues } from "./linter";

function makeMap(obj: Record<string, string>): Map<string, string> {
  return new Map(Object.entries(obj));
}

describe("lintEnvMap", () => {
  it("returns no issues for a clean map", () => {
    const map = makeMap({ API_KEY: "abc123", BASE_URL: "https://example.com" });
    expect(lintEnvMap(map)).toEqual([]);
  });

  it("flags keys with spaces as errors", () => {
    const map = makeMap({ "BAD KEY": "value" });
    const issues = lintEnvMap(map);
    expect(issues).toHaveLength(1);
    expect(issues[0].severity).toBe("error");
    expect(issues[0].key).toBe("BAD KEY");
  });

  it("flags keys starting with a digit as errors", () => {
    const map = makeMap({ "1BAD": "value" });
    const issues = lintEnvMap(map);
    expect(issues.some((i) => i.severity === "error" && i.key === "1BAD")).toBe(true);
  });

  it("warns on case-insensitive duplicate keys", () => {
    const map = makeMap({ API_KEY: "upper", api_key: "lower" });
    const issues = lintEnvMap(map);
    expect(issues.some((i) => i.severity === "warn" && i.message.includes("duplicate"))).toBe(true);
  });

  it("warns on unresolved placeholders in values", () => {
    const map = makeMap({ DATABASE_URL: "postgres://${DB_HOST}/mydb" });
    const issues = lintEnvMap(map);
    expect(issues).toHaveLength(1);
    expect(issues[0].severity).toBe("warn");
    expect(issues[0].message).toContain("${DB_HOST}");
  });

  it("warns when value exceeds max length", () => {
    const map = makeMap({ LONG_VAR: "x".repeat(1025) });
    const issues = lintEnvMap(map);
    expect(issues.some((i) => i.message.includes("exceeds"))).toBe(true);
  });

  it("accumulates multiple issues for the same key", () => {
    const map = makeMap({ "bad key": "${UNRESOLVED}" });
    const issues = lintEnvMap(map);
    expect(issues.length).toBeGreaterThanOrEqual(2);
  });
});

describe("formatLintIssues", () => {
  it("returns a friendly message when there are no issues", () => {
    expect(formatLintIssues([])).toBe("No lint issues found.");
  });

  it("formats issues with severity and key", () => {
    const map = makeMap({ "BAD KEY": "${X}" });
    const issues = lintEnvMap(map);
    const output = formatLintIssues(issues);
    expect(output).toContain("[ERROR]");
    expect(output).toContain("[WARN]");
    expect(output).toContain("BAD KEY");
  });
});
