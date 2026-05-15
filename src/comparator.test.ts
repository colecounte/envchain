import { compareEnvMaps, formatCompareResult, hasChanges, summarizeCompare } from './comparator';

function makeMap(obj: Record<string, string>) {
  return obj;
}

describe('compareEnvMaps', () => {
  it('detects added keys', () => {
    const base = makeMap({ A: '1' });
    const target = makeMap({ A: '1', B: '2' });
    const result = compareEnvMaps(base, target);
    expect(result.added).toEqual({ B: '2' });
    expect(result.removed).toEqual({});
    expect(result.changed).toEqual({});
    expect(result.unchanged).toEqual({ A: '1' });
  });

  it('detects removed keys', () => {
    const base = makeMap({ A: '1', B: '2' });
    const target = makeMap({ A: '1' });
    const result = compareEnvMaps(base, target);
    expect(result.removed).toEqual({ B: '2' });
    expect(result.added).toEqual({});
  });

  it('detects changed keys', () => {
    const base = makeMap({ A: 'old' });
    const target = makeMap({ A: 'new' });
    const result = compareEnvMaps(base, target);
    expect(result.changed).toEqual({ A: { from: 'old', to: 'new' } });
  });

  it('detects unchanged keys', () => {
    const base = makeMap({ A: '1' });
    const target = makeMap({ A: '1' });
    const result = compareEnvMaps(base, target);
    expect(result.unchanged).toEqual({ A: '1' });
    expect(hasChanges(result)).toBe(false);
  });

  it('handles empty maps', () => {
    const result = compareEnvMaps({}, {});
    expect(hasChanges(result)).toBe(false);
  });
});

describe('formatCompareResult', () => {
  it('formats added, removed, changed lines', () => {
    const base = makeMap({ B: 'old', C: 'same' });
    const target = makeMap({ A: 'new', C: 'same' });
    const result = compareEnvMaps(base, target);
    const output = formatCompareResult(result);
    expect(output).toContain('+ A=new');
    expect(output).toContain('- B=old');
    expect(output).not.toContain('C');
  });

  it('includes unchanged when verbose', () => {
    const base = makeMap({ A: '1' });
    const target = makeMap({ A: '1' });
    const result = compareEnvMaps(base, target);
    const output = formatCompareResult(result, true);
    expect(output).toContain('  A=1');
  });
});

describe('summarizeCompare', () => {
  it('returns summary string', () => {
    const base = makeMap({ A: '1', B: '2' });
    const target = makeMap({ A: 'changed', C: 'new' });
    const result = compareEnvMaps(base, target);
    const summary = summarizeCompare(result);
    expect(summary).toContain('added');
    expect(summary).toContain('removed');
    expect(summary).toContain('changed');
  });

  it('returns no differences for identical maps', () => {
    const result = compareEnvMaps({ A: '1' }, { A: '1' });
    expect(summarizeCompare(result)).toBe('no differences');
  });
});
