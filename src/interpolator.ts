/**
 * Interpolates variable references within env values.
 * Supports ${VAR} and $VAR syntax with optional defaults: ${VAR:-default}
 */

export type EnvMap = Map<string, string>;

const REF_PATTERN = /\$\{([^}]+)\}|\$([A-Za-z_][A-Za-z0-9_]*)/g;

function parseRef(ref: string): { name: string; fallback?: string } {
  const colonDash = ref.indexOf(':-');
  if (colonDash !== -1) {
    return { name: ref.slice(0, colonDash), fallback: ref.slice(colonDash + 2) };
  }
  return { name: ref };
}

export function interpolateValue(
  value: string,
  env: EnvMap,
  visited: Set<string> = new Set()
): string {
  return value.replace(REF_PATTERN, (match, braced?: string, bare?: string) => {
    const raw = (braced ?? bare) as string;
    const { name, fallback } = parseRef(raw);

    if (visited.has(name)) {
      // Circular reference — return empty string
      return '';
    }

    const resolved = env.get(name);
    if (resolved !== undefined) {
      const next = new Set(visited);
      next.add(name);
      return interpolateValue(resolved, env, next);
    }

    if (fallback !== undefined) return fallback;

    // Fall back to process.env
    return process.env[name] ?? match;
  });
}

export function interpolateEnvMap(env: EnvMap): EnvMap {
  const result: EnvMap = new Map();
  for (const [key, value] of env) {
    result.set(key, interpolateValue(value, env));
  }
  return result;
}
