import { describe, it, expect } from 'vitest';
import { scopeEnvMap, applyScope, detectScopes, mergeScoped } from './scoper';

type EnvMap = Map<string, string>;

function makeMap(obj: Record<string, string>): EnvMap {
  return new Map(Object.entries(obj));
}

describe('scopeEnvMap', () => {
  it('extracts keys with matching prefix', () => {
    const env = makeMap({ DB_HOST: 'localhost', DB_PORT: '5432', APP_NAME: 'test' });
    const { scoped, remainder } = scopeEnvMap(env, 'DB');
    expect(scoped.get('HOST')).toBe('localhost');
    expect(scoped.get('PORT')).toBe('5432');
    expect(scoped.has('APP_NAME')).toBe(false);
    expect(remainder.get('APP_NAME')).toBe('test');
  });

  it('handles prefix with trailing underscore', () => {
    const env = makeMap({ DB_HOST: 'localhost', OTHER: 'val' });
    const { scoped } = scopeEnvMap(env, 'DB_');
    expect(scoped.get('HOST')).toBe('localhost');
  });

  it('returns empty scoped map when no keys match', () => {
    const env = makeMap({ FOO: 'bar' });
    const { scoped, remainder } = scopeEnvMap(env, 'MISSING');
    expect(scoped.size).toBe(0);
    expect(remainder.size).toBe(1);
  });
});

describe('applyScope', () => {
  it('prefixes all keys', () => {
    const env = makeMap({ HOST: 'localhost', PORT: '5432' });
    const scoped = applyScope(env, 'DB');
    expect(scoped.get('DB_HOST')).toBe('localhost');
    expect(scoped.get('DB_PORT')).toBe('5432');
  });

  it('does not double-underscore when scope ends with _', () => {
    const env = makeMap({ NAME: 'test' });
    const scoped = applyScope(env, 'APP_');
    expect(scoped.has('APP_NAME')).toBe(true);
    expect(scoped.has('APP__NAME')).toBe(false);
  });
});

describe('detectScopes', () => {
  it('returns sorted list of scope prefixes', () => {
    const env = makeMap({ DB_HOST: 'a', DB_PORT: 'b', APP_NAME: 'c', PLAIN: 'd' });
    const scopes = detectScopes(env);
    expect(scopes).toEqual(['APP', 'DB']);
  });

  it('ignores keys without underscores', () => {
    const env = makeMap({ FOO: 'bar', BAZ: 'qux' });
    expect(detectScopes(env)).toEqual([]);
  });
});

describe('mergeScoped', () => {
  it('merges scoped keys back into base with prefix', () => {
    const base = makeMap({ APP_NAME: 'myapp', OTHER: 'val' });
    const scoped = makeMap({ HOST: 'newhost', PORT: '9999' });
    const result = mergeScoped(base, scoped, 'DB');
    expect(result.get('DB_HOST')).toBe('newhost');
    expect(result.get('DB_PORT')).toBe('9999');
    expect(result.get('APP_NAME')).toBe('myapp');
    expect(result.get('OTHER')).toBe('val');
  });

  it('overwrites existing scoped keys', () => {
    const base = makeMap({ DB_HOST: 'old' });
    const scoped = makeMap({ HOST: 'new' });
    const result = mergeScoped(base, scoped, 'DB');
    expect(result.get('DB_HOST')).toBe('new');
  });
});
