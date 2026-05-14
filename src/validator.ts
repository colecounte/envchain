/**
 * Validates parsed environment variable maps for common issues.
 */

export interface ValidationIssue {
  key: string;
  severity: 'error' | 'warn';
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}

const KEY_PATTERN = /^[A-Z_][A-Z0-9_]*$/;
const SENSITIVE_PATTERNS = [/password/i, /secret/i, /token/i, /api_key/i, /private/i];

export function validateEnvMap(
  envMap: Map<string, string>,
  options: { warnOnLowercase?: boolean; warnOnEmpty?: boolean } = {}
): ValidationResult {
  const issues: ValidationIssue[] = [];

  for (const [key, value] of envMap.entries()) {
    if (!KEY_PATTERN.test(key)) {
      if (/^[a-z_][a-z0-9_]*$/i.test(key) && key !== key.toUpperCase()) {
        if (options.warnOnLowercase !== false) {
          issues.push({
            key,
            severity: 'warn',
            message: `Key "${key}" is not uppercase. Convention recommends uppercase env var names.`,
          });
        }
      } else {
        issues.push({
          key,
          severity: 'error',
          message: `Key "${key}" contains invalid characters. Only A-Z, 0-9, and _ are allowed.`,
        });
      }
    }

    if (options.warnOnEmpty !== false && value.trim() === '') {
      issues.push({
        key,
        severity: 'warn',
        message: `Key "${key}" has an empty value.`,
      });
    }

    const isSensitive = SENSITIVE_PATTERNS.some((p) => p.test(key));
    if (isSensitive && value.length > 0 && value.length < 8) {
      issues.push({
        key,
        severity: 'warn',
        message: `Key "${key}" looks sensitive but has a suspiciously short value.`,
      });
    }
  }

  const hasErrors = issues.some((i) => i.severity === 'error');
  return { valid: !hasErrors, issues };
}

export function formatValidationIssues(issues: ValidationIssue[]): string {
  if (issues.length === 0) return 'No issues found.';
  return issues
    .map((i) => `[${i.severity.toUpperCase()}] ${i.key}: ${i.message}`)
    .join('\n');
}
