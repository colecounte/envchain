/**
 * Template rendering: fill a string template using an EnvMap.
 * Useful for generating config files or command strings from resolved env.
 */

import { EnvMap, interpolateValue } from './interpolator';

export interface RenderOptions {
  /** Throw if a referenced variable is missing from env (and process.env). */
  strict?: boolean;
  /** Prefix to require on variable names (e.g. 'APP_'). Ignored if empty. */
  prefix?: string;
}

const MISSING_RE = /\$\{([^}]+)\}|\$([A-Za-z_][A-Za-z0-9_]*)/g;

function collectMissing(rendered: string, original: string): string[] {
  const missing: string[] = [];
  for (const match of original.matchAll(MISSING_RE)) {
    const ref = match[1] ?? match[2];
    const name = ref.includes(':-') ? ref.split(':-')[0] : ref;
    // If the rendered string still contains the raw token, it was unresolved
    if (rendered.includes(match[0])) {
      missing.push(name);
    }
  }
  return missing;
}

export function renderTemplate(
  template: string,
  env: EnvMap,
  options: RenderOptions = {}
): string {
  const { strict = false, prefix = '' } = options;

  const scoped: EnvMap = prefix
    ? new Map([...env].filter(([k]) => k.startsWith(prefix)))
    : env;

  const rendered = interpolateValue(template, scoped);

  if (strict) {
    const missing = collectMissing(rendered, template);
    if (missing.length > 0) {
      throw new Error(
        `renderTemplate: unresolved variables: ${missing.join(', ')}`
      );
    }
  }

  return rendered;
}

export function renderTemplateMap(
  templates: Record<string, string>,
  env: EnvMap,
  options?: RenderOptions
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(templates).map(([k, v]) => [k, renderTemplate(v, env, options)])
  );
}
