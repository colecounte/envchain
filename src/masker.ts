/**
 * masker.ts — Mask env values partially or fully for display/logging purposes.
 */

export type MaskMode = "full" | "partial" | "length";

export interface MaskOptions {
  mode?: MaskMode;
  char?: string;
  visibleChars?: number;
}

const DEFAULT_CHAR = "*";
const DEFAULT_VISIBLE = 4;

export function maskValue(
  value: string,
  options: MaskOptions = {}
): string {
  const { mode = "partial", char = DEFAULT_CHAR, visibleChars = DEFAULT_VISIBLE } = options;

  if (value.length === 0) return value;

  if (mode === "full") {
    return char.repeat(value.length);
  }

  if (mode === "length") {
    return char.repeat(8);
  }

  // partial: show last N chars
  if (value.length <= visibleChars) {
    return char.repeat(value.length);
  }

  const hidden = value.length - visibleChars;
  return char.repeat(hidden) + value.slice(-visibleChars);
}

export function maskEnvMap(
  env: Map<string, string>,
  options: MaskOptions = {}
): Map<string, string> {
  const result = new Map<string, string>();
  for (const [key, value] of env) {
    result.set(key, maskValue(value, options));
  }
  return result;
}

export function maskRecord(
  record: Record<string, string>,
  options: MaskOptions = {}
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(record)) {
    result[key] = maskValue(value, options);
  }
  return result;
}

export function formatMasked(
  env: Map<string, string>,
  options: MaskOptions = {}
): string {
  const lines: string[] = [];
  for (const [key, value] of env) {
    lines.push(`${key}=${maskValue(value, options)}`);
  }
  return lines.join("\n");
}
