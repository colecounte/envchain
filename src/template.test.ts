import { describe, it, expect } from 'vitest';
import { renderTemplate, renderTemplateMap } from './template';
import { EnvMap } from './interpolator';

function makeMap(obj: Record<string, string>): EnvMap {
  return new Map(Object.entries(obj));
}

describe('renderTemplate', () => {
  it('renders a simple template', () => {
    const env = makeMap({ HOST: 'localhost', PORT: '5432' });
    const result = renderTemplate('postgres://${HOST}:${PORT}/db', env);
    expect(result).toBe('postgres://localhost:5432/db');
  });

  it('uses fallback syntax in templates', () => {
    const env = makeMap({});
    const result = renderTemplate('${DB_HOST:-127.0.0.1}', env);
    expect(result).toBe('127.0.0.1');
  });

  it('throws in strict mode when variable is missing', () => {
    const env = makeMap({});
    expect(() =>
      renderTemplate('${REQUIRED_VAR}', env, { strict: true })
    ).toThrow('unresolved variables: REQUIRED_VAR');
  });

  it('does not throw in non-strict mode for missing vars', () => {
    const env = makeMap({});
    expect(() => renderTemplate('${MISSING}', env)).not.toThrow();
  });

  it('filters by prefix when prefix option is set', () => {
    const env = makeMap({ APP_URL: 'http://app', OTHER_URL: 'http://other' });
    const result = renderTemplate('${APP_URL} and ${OTHER_URL}', env, { prefix: 'APP_' });
    // OTHER_URL not in scoped env, stays as-is
    expect(result).toContain('http://app');
    expect(result).toContain('${OTHER_URL}');
  });

  it('handles empty template', () => {
    expect(renderTemplate('', makeMap({}))).toBe('');
  });
});

describe('renderTemplateMap', () => {
  it('renders all templates in a record', () => {
    const env = makeMap({ HOST: 'db', PORT: '3306' });
    const templates = {
      dsn: 'mysql://${HOST}:${PORT}',
      label: 'DB at ${HOST}',
    };
    const result = renderTemplateMap(templates, env);
    expect(result.dsn).toBe('mysql://db:3306');
    expect(result.label).toBe('DB at db');
  });

  it('passes options to each template', () => {
    const env = makeMap({});
    expect(() =>
      renderTemplateMap({ key: '${MISSING}' }, env, { strict: true })
    ).toThrow();
  });
});
