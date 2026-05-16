/**
 * normalizer.ts
 * Normalizes environment variable keys and values:
 * - Key normalization: uppercase, replace hyphens/spaces with underscores, strip invalid chars
 * - Value normalization: trim whitespace, normalize line endings, collapse internal whitespace
 */

export type NormalizeOptions = {
  /** Convert keys to uppercase (default: true) */
  uppercaseKeys?: boolean;
  /** Replace hyphens and spaces in keys with underscores (default: true) */
  underscoreKeys?: boolean;
  /** Strip characters from keys that are not alphanumeric or underscore (default: true) */
  stripInvalidKeyChars?: boolean;
  /** Trim leading/trailing whitespace from values (default: true) */
  trimValues?: boolean;
  /** Normalize CRLF/CR line endings to LF in values (default: true) */
  normalizeLineEndings?: boolean;
  /** Collapse runs of internal whitespace in values to a single space (default: false) */
  collapseWhitespace?: boolean;
};

const DEFAULTS: Required<NormalizeOptions> = {
  uppercaseKeys: true,
  underscoreKeys: true,
  stripInvalidKeyChars: true,
  trimValues: true,
  normalizeLineEndings: true,
  collapseWhitespace: false,
};

export type NormalizeSummary = {
  /** Keys that were renamed during normalization */
  renamedKeys: Array<{ from: string; to: string }>;
  /** Keys that were dropped because they normalized to an empty string */
  droppedKeys: string[];
  /** Keys whose values were changed */
  changedValues: string[];
};

/** Normalize a single key according to options. Returns null if the result is empty. */
export function normalizeKey(key: string, opts: Required<NormalizeOptions>): string | null {
  let k = key;
  if (opts.underscoreKeys) {
    k = k.replace(/[-\s]+/g, "_");
  }
  if (opts.stripInvalidKeyChars) {
    k = k.replace(/[^a-zA-Z0-9_]/g, "");
  }
  if (opts.uppercaseKeys) {
    k = k.toUpperCase();
  }
  return k.length > 0 ? k : null;
}

/** Normalize a single value according to options. */
export function normalizeValue(value: string, opts: Required<NormalizeOptions>): string {
  let v = value;
  if (opts.normalizeLineEndings) {
    v = v.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  }
  if (opts.trimValues) {
    v = v.trim();
  }
  if (opts.collapseWhitespace) {
    v = v.replace(/[ \t]+/g, " ");
  }
  return v;
}

/**
 * Normalize an entire env map.
 * When two keys normalize to the same result, the last one wins (in Map insertion order).
 */
export function normalizeEnvMap(
  env: Map<string, string>,
  options: NormalizeOptions = {}
): { result: Map<string, string>; summary: NormalizeSummary } {
  const opts: Required<NormalizeOptions> = { ...DEFAULTS, ...options };
  const result = new Map<string, string>();
  const summary: NormalizeSummary = {
    renamedKeys: [],
    droppedKeys: [],
    changedValues: [],
  };

  for (const [key, value] of env) {
    const normalizedKey = normalizeKey(key, opts);
    if (normalizedKey === null) {
      summary.droppedKeys.push(key);
      continue;
    }
    if (normalizedKey !== key) {
      summary.renamedKeys.push({ from: key, to: normalizedKey });
    }

    const normalizedValue = normalizeValue(value, opts);
    if (normalizedValue !== value) {
      summary.changedValues.push(normalizedKey);
    }

    result.set(normalizedKey, normalizedValue);
  }

  return { result, summary };
}

/** Format a human-readable summary of normalization changes. */
export function formatNormalizeSummary(summary: NormalizeSummary): string {
  const lines: string[] = [];
  if (summary.renamedKeys.length > 0) {
    lines.push("Renamed keys:");
    for (const { from, to } of summary.renamedKeys) {
      lines.push(`  ${from} → ${to}`);
    }
  }
  if (summary.droppedKeys.length > 0) {
    lines.push("Dropped keys (empty after normalization):");
    for (const k of summary.droppedKeys) {
      lines.push(`  ${k}`);
    }
  }
  if (summary.changedValues.length > 0) {
    lines.push("Values normalized:");
    for (const k of summary.changedValues) {
      lines.push(`  ${k}`);
    }
  }
  if (lines.length === 0) {
    return "No changes during normalization.";
  }
  return lines.join("\n");
}
