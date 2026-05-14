/**
 * Formats a resolved env map into various output formats.
 */

export type OutputFormat = "dotenv" | "export" | "json" | "csv";

/**
 * Formats an env map as a .env file string.
 */
export function formatDotenv(env: Map<string, string>): string {
  const lines: string[] = [];
  for (const [key, value] of env) {
    const escaped = value.includes("\n") ? `"${value.replace(/"/g, '\\"')}"` : value;
    lines.push(`${key}=${escaped}`);
  }
  return lines.join("\n") + (lines.length > 0 ? "\n" : "");
}

/**
 * Formats an env map as shell export statements.
 */
export function formatExport(env: Map<string, string>): string {
  const lines: string[] = [];
  for (const [key, value] of env) {
    const escaped = value.replace(/'/g, "'\\''" );
    lines.push(`export ${key}='${escaped}'`);
  }
  return lines.join("\n") + (lines.length > 0 ? "\n" : "");
}

/**
 * Formats an env map as a JSON object string.
 */
export function formatJson(env: Map<string, string>): string {
  const obj: Record<string, string> = {};
  for (const [key, value] of env) {
    obj[key] = value;
  }
  return JSON.stringify(obj, null, 2) + "\n";
}

/**
 * Formats an env map as CSV (key,value).
 */
export function formatCsv(env: Map<string, string>): string {
  const lines = ["key,value"];
  for (const [key, value] of env) {
    const escapedValue = value.includes(",") || value.includes('"') || value.includes("\n")
      ? `"${value.replace(/"/g, '""')}"`
      : value;
    lines.push(`${key},${escapedValue}`);
  }
  return lines.join("\n") + "\n";
}

/**
 * Dispatches to the appropriate formatter based on format string.
 */
export function formatEnvMap(env: Map<string, string>, format: OutputFormat): string {
  switch (format) {
    case "dotenv": return formatDotenv(env);
    case "export": return formatExport(env);
    case "json":   return formatJson(env);
    case "csv":    return formatCsv(env);
    default:
      throw new Error(`Unknown output format: ${format}`);
  }
}
