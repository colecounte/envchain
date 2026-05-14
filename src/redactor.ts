/**
 * redactor.ts — Masks sensitive environment variable values for safe logging/display.
 */

export type RedactOptions = {
  mask?: string;
  revealChars?: number;
  sensitiveKeys?: RegExp;
};

const DEFAULT_SENSITIVE_KEYS =
  /secret|password|passwd|token|api[_-]?key|private|credential|auth|jwt|cert/i;

const DEFAULT_MASK = "****";

export function isSensitiveKey(
  key: string,
  pattern: RegExp = DEFAULT_SENSITIVE_KEYS
): boolean {
  return pattern.test(key);
}

export function redactValue(
  value: string,
  opts: RedactOptions = {}
): string {
  const mask = opts.mask ?? DEFAULT_MASK;
  const reveal = opts.revealChars ?? 0;
  if (reveal <= 0 || value.length <= reveal) return mask;
  return value.slice(0, reveal) + mask;
}

export function redactEnvMap(
  env: Map<string, string>,
  opts: RedactOptions = {}
): Map<string, string> {
  const sensitiveKeys = opts.sensitiveKeys ?? DEFAULT_SENSITIVE_KEYS;
  const result = new Map<string, string>();
  for (const [key, value] of env) {
    result.set(
      key,
      isSensitiveKey(key, sensitiveKeys) ? redactValue(value, opts) : value
    );
  }
  return result;
}

export function redactRecord(
  env: Record<string, string>,
  opts: RedactOptions = {}
): Record<string, string> {
  const out: Record<string, string> = {};
  const sensitiveKeys = opts.sensitiveKeys ?? DEFAULT_SENSITIVE_KEYS;
  for (const [key, value] of Object.entries(env)) {
    out[key] = isSensitiveKey(key, sensitiveKeys)
      ? redactValue(value, opts)
      : value;
  }
  return out;
}
