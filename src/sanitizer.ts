/**
 * sanitizer.ts — Strip, trim, and normalize env values
 */

export type SanitizeOptions = {
  trimWhitespace?: boolean;
  removeNullBytes?: boolean;
  normalizeLineEndings?: boolean;
  maxLength?: number;
};

const DEFAULT_OPTIONS: Required<SanitizeOptions> = {
  trimWhitespace: true,
  removeNullBytes: true,
  normalizeLineEndings: true,
  maxLength: 4096,
};

export function sanitizeValue(value: string, opts: SanitizeOptions = {}): string {
  const options = { ...DEFAULT_OPTIONS, ...opts };

  let result = value;

  if (options.removeNullBytes) {
    result = result.replace(/\0/g, "");
  }

  if (options.normalizeLineEndings) {
    result = result.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  }

  if (options.trimWhitespace) {
    result = result.trim();
  }

  if (options.maxLength > 0 && result.length > options.maxLength) {
    result = result.slice(0, options.maxLength);
  }

  return result;
}

export function sanitizeEnvMap(
  env: Map<string, string>,
  opts: SanitizeOptions = {}
): Map<string, string> {
  const result = new Map<string, string>();
  for (const [key, value] of env) {
    const sanitizedKey = key.trim().replace(/\s+/g, "_").toUpperCase();
    const sanitizedValue = sanitizeValue(value, opts);
    if (sanitizedKey.length > 0) {
      result.set(sanitizedKey, sanitizedValue);
    }
  }
  return result;
}

export function formatSanitizeSummary(
  original: Map<string, string>,
  sanitized: Map<string, string>
): string {
  const lines: string[] = [];
  for (const [key, origVal] of original) {
    const normKey = key.trim().replace(/\s+/g, "_").toUpperCase();
    const newVal = sanitized.get(normKey);
    if (newVal !== undefined && newVal !== origVal) {
      lines.push(`  ${normKey}: changed (${origVal.length} -> ${newVal.length} chars)`);
    }
  }
  if (lines.length === 0) return "No changes during sanitization.";
  return `Sanitized ${lines.length} value(s):\n${lines.join("\n")}`;
}
