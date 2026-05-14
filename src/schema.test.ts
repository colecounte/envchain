import { describe, it, expect } from 'vitest';
import { applySchema, EnvSchema } from './schema';

function makeMap(obj: Record<string, string>): Map<string, string> {
  return new Map(Object.entries(obj));
}

describe('applySchema', () => {
  it('passes with no violations for valid data', () => {
    const schema: EnvSchema = {
      PORT: { type: 'number', required: true },
      DEBUG: { type: 'boolean' },
    };
    const { violations } = applySchema(makeMap({ PORT: '3000', DEBUG: 'true' }), schema);
    expect(violations).toHaveLength(0);
  });

  it('reports violation for missing required key', () => {
    const schema: EnvSchema = { DATABASE_URL: { required: true } };
    const { violations } = applySchema(makeMap({}), schema);
    expect(violations).toHaveLength(1);
    expect(violations[0].key).toBe('DATABASE_URL');
    expect(violations[0].message).toMatch(/Required/);
  });

  it('applies default value when key is absent', () => {
    const schema: EnvSchema = { LOG_LEVEL: { default: 'info' } };
    const { result, violations } = applySchema(makeMap({}), schema);
    expect(result.get('LOG_LEVEL')).toBe('info');
    expect(violations).toHaveLength(0);
  });

  it('does not override existing value with default', () => {
    const schema: EnvSchema = { LOG_LEVEL: { default: 'info' } };
    const { result } = applySchema(makeMap({ LOG_LEVEL: 'debug' }), schema);
    expect(result.get('LOG_LEVEL')).toBe('debug');
  });

  it('reports violation for non-numeric value with number type', () => {
    const schema: EnvSchema = { PORT: { type: 'number' } };
    const { violations } = applySchema(makeMap({ PORT: 'abc' }), schema);
    expect(violations[0].message).toMatch(/number/);
  });

  it('reports violation for invalid boolean', () => {
    const schema: EnvSchema = { ENABLED: { type: 'boolean' } };
    const { violations } = applySchema(makeMap({ ENABLED: 'yes' }), schema);
    expect(violations[0].message).toMatch(/boolean/);
  });

  it('reports violation for invalid URL', () => {
    const schema: EnvSchema = { API_URL: { type: 'url' } };
    const { violations } = applySchema(makeMap({ API_URL: 'not-a-url' }), schema);
    expect(violations[0].message).toMatch(/URL/);
  });

  it('accepts valid URL', () => {
    const schema: EnvSchema = { API_URL: { type: 'url' } };
    const { violations } = applySchema(makeMap({ API_URL: 'https://api.example.com' }), schema);
    expect(violations).toHaveLength(0);
  });

  it('accepts 1 and 0 as valid booleans', () => {
    const schema: EnvSchema = { FLAG: { type: 'boolean' } };
    const { violations: v1 } = applySchema(makeMap({ FLAG: '1' }), schema);
    const { violations: v2 } = applySchema(makeMap({ FLAG: '0' }), schema);
    expect(v1).toHaveLength(0);
    expect(v2).toHaveLength(0);
  });
});
