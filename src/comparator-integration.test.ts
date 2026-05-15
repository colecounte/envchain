import { compareEnvMaps, formatCompareResult, hasChanges, summarizeCompare } from './comparator';
import { mergeEnvMaps } from './merger';
import { parseEnvContent } from './parser';

describe('comparator integration', () => {
  const rawBase = `
DB_HOST=localhost
DB_PORT=5432
APP_ENV=development
SECRET_KEY=abc123
`.trim();

  const rawTarget = `
DB_HOST=prod.db.example.com
DB_PORT=5432
APP_ENV=production
NEW_FEATURE=enabled
`.trim();

  it('compares parsed env files end-to-end', () => {
    const base = parseEnvContent(rawBase);
    const target = parseEnvContent(rawTarget);
    const result = compareEnvMaps(base, target);

    expect(result.changed['DB_HOST']).toEqual({
      from: 'localhost',
      to: 'prod.db.example.com',
    });
    expect(result.changed['APP_ENV']).toEqual({
      from: 'development',
      to: 'production',
    });
    expect(result.unchanged['DB_PORT']).toBe('5432');
    expect(result.added['NEW_FEATURE']).toBe('enabled');
    expect(result.removed['SECRET_KEY']).toBe('abc123');
    expect(hasChanges(result)).toBe(true);
  });

  it('compares merged env against override', () => {
    const defaults = parseEnvContent('LOG_LEVEL=info\nTIMEOUT=30');
    const overrides = parseEnvContent('LOG_LEVEL=debug');
    const merged = mergeEnvMaps([defaults, overrides]);
    const fresh = parseEnvContent('LOG_LEVEL=debug\nTIMEOUT=30');
    const result = compareEnvMaps(merged, fresh);
    expect(hasChanges(result)).toBe(false);
    expect(summarizeCompare(result)).toBe('no differences');
  });

  it('formats a realistic diff output', () => {
    const base = parseEnvContent(rawBase);
    const target = parseEnvContent(rawTarget);
    const result = compareEnvMaps(base, target);
    const output = formatCompareResult(result);
    expect(output.split('\n').length).toBeGreaterThan(3);
    expect(output).toMatch(/^[+\-~]/m);
  });

  it('summarize reflects all change types', () => {
    const base = parseEnvContent('A=1\nB=2\nC=3');
    const target = parseEnvContent('A=changed\nC=3\nD=new');
    const result = compareEnvMaps(base, target);
    const summary = summarizeCompare(result);
    expect(summary).toContain('1 added');
    expect(summary).toContain('1 removed');
    expect(summary).toContain('1 changed');
    expect(summary).toContain('1 unchanged');
  });
});
