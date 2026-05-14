import * as fs from 'fs';
import * as path from 'path';
import { parseEnvContent } from './parser';
import { mergeEnvMaps } from './merger';

export type Context = 'local' | 'staging' | 'ci' | string;

export interface ResolveOptions {
  baseDir?: string;
  contexts?: Context[];
  override?: Record<string, string>;
}

const DEFAULT_CONTEXTS: Context[] = ['local'];

function envFileCandidates(baseDir: string, context: Context): string[] {
  return [
    path.join(baseDir, '.env'),
    path.join(baseDir, `.env.${context}`),
  ];
}

function readEnvFile(filePath: string): Record<string, string> {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return parseEnvContent(content);
  } catch {
    return {};
  }
}

export function resolveEnv(options: ResolveOptions = {}): Record<string, string> {
  const baseDir = options.baseDir ?? process.cwd();
  const contexts = options.contexts ?? DEFAULT_CONTEXTS;
  const override = options.override ?? {};

  // Start with base .env
  const basePath = path.join(baseDir, '.env');
  let merged = readEnvFile(basePath);

  // Cascade through each context
  for (const context of contexts) {
    const contextPath = path.join(baseDir, `.env.${context}`);
    const contextMap = readEnvFile(contextPath);
    merged = mergeEnvMaps(merged, contextMap);
  }

  // Apply programmatic overrides last
  if (Object.keys(override).length > 0) {
    merged = mergeEnvMaps(merged, override);
  }

  return merged;
}

export function resolveEnvToProcess(options: ResolveOptions = {}): void {
  const resolved = resolveEnv(options);
  for (const [key, value] of Object.entries(resolved)) {
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}
