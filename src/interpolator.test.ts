import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { interpolateValue, interpolateEnvMap, EnvMap } from './interpolator';

function makeMap(obj: Record<string, string>): EnvMap {
  return new Map(Object.entries(obj));
}

describe('interpolateValue', () => {
  it('returns plain string unchanged', () => {
    expect(interpolateValue('hello', makeMap({}))).toBe('hello');
  });

  it('resolves ${VAR} syntax', () => {
    const env = makeMap({ HOME: '/home/user' });
    expect(interpolateValue('${HOME}/bin', env)).toBe('/home/user/bin');
  });

  it('resolves $VAR bare syntax', () => {
    const env = makeMap({ NAME: 'world' });
    expect(interpolateValue('hello $NAME', env)).toBe('hello world');
  });

  it('uses fallback when var is missing', () => {
    expect(interpolateValue('${MISSING:-default_val}', makeMap({}))).toBe('default_val');
  });

  it('prefers env value over fallback', () => {
    const env = makeMap({ FOO: 'bar' });
    expect(interpolateValue('${FOO:-fallback}', env)).toBe('bar');
  });

  it('handles circular references gracefully', () => {
    const env = makeMap({ A: '${B}', B: '${A}' });
    // Should not throw and return empty for circular
    const result = interpolateValue('${A}', env);
    expect(typeof result).toBe('string');
  });

  it('falls back to process.env for unknown vars', () => {
    process.env['_TEST_INTERP'] = 'fromprocess';
    const result = interpolateValue('${_TEST_INTERP}', makeMap({}));
    expect(result).toBe('fromprocess');
    delete process.env['_TEST_INTERP'];
  });
});

describe('interpolateEnvMap', () => {
  it('interpolates all values in map', () => {
    const env = makeMap({ BASE: '/app', DATA: '${BASE}/data', LOG: '${BASE}/log' });
    const result = interpolateEnvMap(env);
    expect(result.get('DATA')).toBe('/app/data');
    expect(result.get('LOG')).toBe('/app/log');
  });

  it('leaves unresolvable references as-is', () => {
    const env = makeMap({ KEY: '${TOTALLY_UNKNOWN_XYZ}' });
    const result = interpolateEnvMap(env);
    expect(result.get('KEY')).toBe('${TOTALLY_UNKNOWN_XYZ}');
  });

  it('returns a new map without mutating original', () => {
    const env = makeMap({ A: 'hello', B: '$A world' });
    const result = interpolateEnvMap(env);
    expect(env.get('B')).toBe('$A world');
    expect(result.get('B')).toBe('hello world');
  });
});
