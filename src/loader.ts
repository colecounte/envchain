import * as fs from "fs";
import * as path from "path";
import { parseEnvContent } from "./parser";
import { mergeEnvMaps } from "./merger";
import { resolveEnv } from "./resolver";

export type Context = "local" | "staging" | "ci" | string;

export interface LoadOptions {
  cwd?: string;
  context?: Context;
  overrideProcessEnv?: boolean;
}

export interface LoadResult {
  env: Record<string, string>;
  sources: string[];
  warnings: string[];
}

/**
 * Loads and merges env files for the given context.
 * Falls back gracefully if files are missing.
 */
export function loadEnv(options: LoadOptions = {}): LoadResult {
  const cwd = options.cwd ?? process.cwd();
  const context = options.context ?? detectContext();
  const warnings: string[] = [];
  const sources: string[] = [];

  const candidates = [
    path.join(cwd, ".env"),
    path.join(cwd, `.env.${context}`),
    path.join(cwd, `.env.${context}.local`),
    path.join(cwd, ".env.local"),
  ];

  let merged: Record<string, string> = {};

  for (const filePath of candidates) {
    if (!fs.existsSync(filePath)) continue;
    try {
      const raw = fs.readFileSync(filePath, "utf-8");
      const parsed = parseEnvContent(raw);
      merged = mergeEnvMaps(merged, parsed);
      sources.push(filePath);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      warnings.push(`Could not read ${filePath}: ${msg}`);
    }
  }

  if (options.overrideProcessEnv) {
    for (const [key, value] of Object.entries(merged)) {
      process.env[key] = value;
    }
  }

  return { env: merged, sources, warnings };
}

function detectContext(): Context {
  if (process.env.CI === "true" || process.env.CI === "1") return "ci";
  if (process.env.NODE_ENV) return process.env.NODE_ENV;
  return "local";
}
