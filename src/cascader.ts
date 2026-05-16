import { EnvMap } from './merger';
import { mergeEnvMaps } from './merger';
import { readEnvFile, envFileCandidates } from './resolver';
import { parseEnvContent } from './parser';

export type CascadeContext = 'local' | 'staging' | 'ci' | 'production' | string;

export interface CascadeOptions {
  context: CascadeContext;
  baseDir?: string;
  strict?: boolean;
}

export interface CascadeResult {
  merged: EnvMap;
  sources: string[];
  skipped: string[];
}

/**
 * Returns the ordered list of contexts to cascade through.
 * More specific contexts override less specific ones.
 */
export function cascadeOrder(context: CascadeContext): CascadeContext[] {
  const base: CascadeContext[] = ['base', context];
  if (context !== 'local') base.push('local');
  return base;
}

/**
 * Loads and merges env files in cascade order for the given context.
 * Later contexts take priority over earlier ones.
 */
export async function cascadeEnv(options: CascadeOptions): Promise<CascadeResult> {
  const { context, baseDir = process.cwd(), strict = false } = options;
  const order = cascadeOrder(context);
  const sources: string[] = [];
  const skipped: string[] = [];
  let merged: EnvMap = new Map();

  for (const ctx of order) {
    const candidates = envFileCandidates(ctx, baseDir);
    for (const candidate of candidates) {
      const raw = await readEnvFile(candidate);
      if (raw === null) {
        skipped.push(candidate);
        continue;
      }
      const parsed = parseEnvContent(raw);
      merged = mergeEnvMaps(merged, parsed, { strategy: 'last-wins' });
      sources.push(candidate);
      break; // use first found candidate per context
    }
  }

  if (strict && sources.length === 0) {
    throw new Error(`No env files found for context: ${context}`);
  }

  return { merged, sources, skipped };
}

export function formatCascadeResult(result: CascadeResult): string {
  const lines: string[] = [];
  lines.push(`Loaded ${result.sources.length} file(s):`);
  for (const s of result.sources) lines.push(`  + ${s}`);
  if (result.skipped.length > 0) {
    lines.push(`Skipped ${result.skipped.length} missing file(s):`);
    for (const s of result.skipped) lines.push(`  - ${s}`);
  }
  return lines.join('\n');
}
