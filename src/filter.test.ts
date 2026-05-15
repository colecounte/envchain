import { describe, it, expect } from 'vitest';
import {
  matchesPattern,
  filterEnvMap,
  filterNonEmpty,
  filterByPrefix,
} from './filter';

function makeMap(obj: Record<string, string>): Map<string, string> {
  return new Map(Object.entries(obj));
}

describe('matchesPattern', () => {
  it('matches exact key', () => {
    expect(matchesPattern('FOO', ['FOO', 'BAR'])).toBe(true);
  });

  it('does not match non-listed key', () => {
    expect(matchesPattern('BAZ', ['FOO', 'BAR'])).toBe(false);
  });

  it('matches wildcard prefix', () => {
    expect(matchesPattern('APP_SECRET', ['APP_*'])).toBe(true);
  });

  it('does not match different prefix', () => {
    expect(matchesPattern('DB_HOST', ['APP_*'])).toBe(false);
  });
});

describe('filterEnvMap', () => {
  const env = makeMap({
    APP_NAME: 'envchain',
    APP_ENV: 'test',
    DB_HOST: 'localhost',
    DB_PASS: 'secret',
    EMPTY_VAL: '',
  });

  it('returns all entries when no options given', () => {
    const result = filterEnvMap(env);
    expect(result.size).toBe(5);
  });

  it('includes only matching keys', () => {
    const result = filterEnvMap(env, { include: ['APP_*'] });
    expect([...result.keys()]).toEqual(['APP_NAME', 'APP_ENV']);
  });

  it('excludes matching keys', () => {
    const result = filterEnvMap(env, { exclude: ['DB_*'] });
    expect(result.has('DB_HOST')).toBe(false);
    expect(result.has('DB_PASS')).toBe(false);
    expect(result.has('APP_NAME')).toBe(true);
  });

  it('applies predicate filter', () => {
    const result = filterEnvMap(env, {
      predicate: (k) => k.includes('PASS') || k.includes('SECRET'),
    });
    expect([...result.keys()]).toEqual(['DB_PASS']);
  });

  it('combines include and exclude', () => {
    const result = filterEnvMap(env, {
      include: ['APP_*', 'DB_*'],
      exclude: ['DB_PASS'],
    });
    expect(result.has('APP_NAME')).toBe(true);
    expect(result.has('DB_HOST')).toBe(true);
    expect(result.has('DB_PASS')).toBe(false);
  });
});

describe('filterNonEmpty', () => {
  it('removes keys with empty values', () => {
    const env = makeMap({ A: 'hello', B: '', C: '  ' });
    const result = filterNonEmpty(env);
    expect(result.has('A')).toBe(true);
    expect(result.has('B')).toBe(false);
    expect(result.has('C')).toBe(false);
  });
});

describe('filterByPrefix', () => {
  it('keeps only keys with given prefix', () => {
    const env = makeMap({ REACT_APP_ID: '1', REACT_APP_NAME: 'x', OTHER: 'y' });
    const result = filterByPrefix(env, 'REACT_APP_');
    expect([...result.keys()]).toEqual(['REACT_APP_ID', 'REACT_APP_NAME']);
  });
});
