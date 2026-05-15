/**
 * linter.ts — Lint an env map for common issues:
 *   - keys with spaces or invalid characters
 *   - values that look like unresolved placeholders
 *   - duplicate keys (case-insensitive)
 *   - overly long values
 */

export type LintSeverity = "error" | "warn";

export interface LintIssue {
  key: string;
  message: string;
  severity: LintSeverity;
}

const KEY_RE = /^[A-Z_][A-Z0-9_]*$/i;
const UNRESOLVED_RE = /\$\{[^}]+\}/;
const MAX_VALUE_LENGTH = 1024;

export function lintEnvMap(
  map: Map<string, string>
): LintIssue[] {
  const issues: LintIssue[] = [];
  const lowerKeys = new Map<string, string>();

  for (const [key, value] of map.entries()) {
    // Invalid key format
    if (!KEY_RE.test(key)) {
      issues.push({
        key,
        message: `Key "${key}" contains invalid characters (expected A-Z, 0-9, _).`,
        severity: "error",
      });
    }

    // Case-insensitive duplicate detection
    const lower = key.toLowerCase();
    if (lowerKeys.has(lower)) {
      issues.push({
        key,
        message: `Key "${key}" conflicts with "${lowerKeys.get(lower)}" (case-insensitive duplicate).`,
        severity: "warn",
      });
    } else {
      lowerKeys.set(lower, key);
    }

    // Unresolved placeholder
    if (UNRESOLVED_RE.test(value)) {
      issues.push({
        key,
        message: `Value for "${key}" contains an unresolved placeholder: ${value.match(UNRESOLVED_RE)![0]}.`,
        severity: "warn",
      });
    }

    // Overly long value
    if (value.length > MAX_VALUE_LENGTH) {
      issues.push({
        key,
        message: `Value for "${key}" exceeds ${MAX_VALUE_LENGTH} characters (${value.length}).`,
        severity: "warn",
      });
    }
  }

  return issues;
}

export function formatLintIssues(issues: LintIssue[]): string {
  if (issues.length === 0) return "No lint issues found.";
  return issues
    .map((i) => `[${i.severity.toUpperCase()}] ${i.key}: ${i.message}`)
    .join("\n");
}
