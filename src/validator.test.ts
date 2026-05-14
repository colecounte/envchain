import { describe, it, expect } from 'vitest';
import { validateEnvMap, formatValidationIssues } from './validator';

function makeMap(obj: Record<string, string>): Map<string, string> {
  return new Map(Object.entries(obj));
}

describe('validateEnvMap', () => {
  it('returns valid for a clean map', () => {
    const result = validateEnvMap(makeMap({ DATABASE_URL: 'postgres://localhost/db', PORT: '3000' }));
    expect(result.valid).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it('warns on lowercase keys', () => {
    const result = validateEnvMap(makeMap({ database_url: 'postgres://localhost/db' }));
    const warn = result.issues.find((i) => i.key === 'database_url');
    expect(warn).toBeDefined();
    expect(warn?.severity).toBe('warn');
  });

  it('errors on keys with invalid characters', () => {
    const result = validateEnvMap(makeMap({ 'MY-KEY': 'value' }));
    expect(result.valid).toBe(false);
    const err = result.issues.find((i) => i.key === 'MY-KEY');
    expect(err?.severity).toBe('error');
  });

  it('warns on empty values', () => {
    const result = validateEnvMap(makeMap({ API_URL: '' }));
    const warn = result.issues.find((i) => i.key === 'API_URL');
    expect(warn?.severity).toBe('warn');
  });

  it('warns on short sensitive values', () => {
    const result = validateEnvMap(makeMap({ API_SECRET: 'abc' }));
    const warn = result.issues.find((i) => i.key === 'API_SECRET');
    expect(warn?.severity).toBe('warn');
    expect(warn?.message).toMatch(/suspiciously short/);
  });

  it('does not warn on sensitive keys with long enough values', () => {
    const result = validateEnvMap(makeMap({ API_TOKEN: 'supersecrettoken123' }));
    const sensitiveIssue = result.issues.find(
      (i) => i.key === 'API_TOKEN' && i.message.includes('suspiciously short')
    );
    expect(sensitiveIssue).toBeUndefined();
  });

  it('suppresses lowercase warning when option is false', () => {
    const result = validateEnvMap(makeMap({ my_var: 'val' }), { warnOnLowercase: false });
    expect(result.issues).toHaveLength(0);
  });

  it('suppresses empty value warning when option is false', () => {
    const result = validateEnvMap(makeMap({ EMPTY_VAR: '' }), { warnOnEmpty: false });
    expect(result.issues).toHaveLength(0);
  });
});

describe('formatValidationIssues', () => {
  it('returns a no-issue message for empty array', () => {
    expect(formatValidationIssues([])).toBe('No issues found.');
  });

  it('formats issues with severity and key', () => {
    const result = validateEnvMap(makeMap({ 'BAD-KEY': 'val', EMPTY: '' }));
    const formatted = formatValidationIssues(result.issues);
    expect(formatted).toMatch(/\[ERROR\]/);
    expect(formatted).toMatch(/BAD-KEY/);
    expect(formatted).toMatch(/\[WARN\]/);
    expect(formatted).toMatch(/EMPTY/);
  });
});
