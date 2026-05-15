/**
 * Optional schema definition and enforcement for expected env vars.
 */

export type EnvVarType = 'string' | 'number' | 'boolean' | 'url';

export interface EnvVarSchema {
  type?: EnvVarType;
  required?: boolean;
  default?: string;
  description?: string;
}

export type EnvSchema = Record<string, EnvVarSchema>;

export interface SchemaViolation {
  key: string;
  message: string;
}

const URL_PATTERN = /^https?:\/\/.+/;

function coerceCheck(key: string, value: string, type: EnvVarType): SchemaViolation | null {
  switch (type) {
    case 'number':
      if (isNaN(Number(value))) {
        return { key, message: `Expected a number but got "${value}"` };
      }
      break;
    case 'boolean':
      if (!['true', 'false', '1', '0'].includes(value.toLowerCase())) {
        return { key, message: `Expected a boolean (true/false/1/0) but got "${value}"` };
      }
      break;
    case 'url':
      if (!URL_PATTERN.test(value)) {
        return { key, message: `Expected a valid HTTP/HTTPS URL but got "${value}"` };
      }
      break;
  }
  return null;
}

export function applySchema(
  envMap: Map<string, string>,
  schema: EnvSchema
): { result: Map<string, string>; violations: SchemaViolation[] } {
  const result = new Map(envMap);
  const violations: SchemaViolation[] = [];

  for (const [key, def] of Object.entries(schema)) {
    const hasValue = result.has(key);

    if (!hasValue && def.default !== undefined) {
      result.set(key, def.default);
    }

    const value = result.get(key);

    if (def.required && (value === undefined || value.trim() === '')) {
      violations.push({ key, message: `Required variable "${key}" is missing or empty.` });
      continue;
    }

    if (value !== undefined && def.type) {
      const violation = coerceCheck(key, value, def.type);
      if (violation) violations.push(violation);
    }
  }

  return { result, violations };
}

/**
 * Formats schema violations into human-readable strings.
 * Useful for logging or displaying errors to the user.
 */
export function formatViolations(violations: SchemaViolation[]): string[] {
  return violations.map(({ key, message }) => `[${key}] ${message}`);
}
