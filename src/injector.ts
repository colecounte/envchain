import { EnvMap } from "./merger";

export interface InjectOptions {
  override?: boolean;
  prefix?: string;
  dryRun?: boolean;
}

export interface InjectResult {
  injected: string[];
  skipped: string[];
  overridden: string[];
}

/**
 * Injects an EnvMap into process.env, respecting override and prefix options.
 */
export function injectEnvMap(
  envMap: EnvMap,
  target: NodeJS.ProcessEnv = process.env,
  options: InjectOptions = {}
): InjectResult {
  const { override = false, prefix = "", dryRun = false } = options;
  const result: InjectResult = { injected: [], skipped: [], overridden: [] };

  for (const [key, value] of Object.entries(envMap)) {
    const finalKey = prefix ? `${prefix}${key}` : key;
    const exists = finalKey in target;

    if (exists && !override) {
      result.skipped.push(finalKey);
      continue;
    }

    if (!dryRun) {
      target[finalKey] = value;
    }

    if (exists && override) {
      result.overridden.push(finalKey);
    } else {
      result.injected.push(finalKey);
    }
  }

  return result;
}

export function formatInjectResult(result: InjectResult): string {
  const lines: string[] = [];
  if (result.injected.length > 0)
    lines.push(`Injected: ${result.injected.join(", ")}`);
  if (result.overridden.length > 0)
    lines.push(`Overridden: ${result.overridden.join(", ")}`);
  if (result.skipped.length > 0)
    lines.push(`Skipped (already set): ${result.skipped.join(", ")}`);
  return lines.join("\n");
}
