import { mergeEnvMaps, MergeResult } from './merger';

describe('mergeEnvMaps', () => {
  const local = { context: 'local', env: { APP_ENV: 'local', DB_HOST: 'localhost', PORT: '3000' } };
  const staging = { context: 'staging', env: { APP_ENV: 'staging', DB_HOST: 'staging.db.internal' } };
  const ci = { context: 'ci', env: { CI: 'true', PORT: '8080' } };

  it('merges non-conflicting keys from multiple contexts', () => {
    const result = mergeEnvMaps([local, ci]);
    expect(result.env).toMatchObject({
      APP_ENV: 'local',
      DB_HOST: 'localhost',
      PORT: '8080',
      CI: 'true',
    });
  });

  it('uses last-wins strategy by default', () => {
    const result = mergeEnvMaps([local, staging]);
    expect(result.env.APP_ENV).toBe('staging');
    expect(result.env.DB_HOST).toBe('staging.db.internal');
  });

  it('respects first-wins strategy', () => {
    const result = mergeEnvMaps([local, staging], { strategy: 'first-wins' });
    expect(result.env.APP_ENV).toBe('local');
    expect(result.env.DB_HOST).toBe('localhost');
  });

  it('records conflicts with resolved value', () => {
    const result = mergeEnvMaps([local, staging]);
    const conflict = result.conflicts.find((c) => c.key === 'APP_ENV');
    expect(conflict).toBeDefined();
    expect(conflict?.resolved).toBe('staging');
    expect(conflict?.values).toHaveLength(2);
  });

  it('throws on conflict when strategy is error', () => {
    expect(() => mergeEnvMaps([local, staging], { strategy: 'error' })).toThrow(
      /Conflict for key "APP_ENV"/
    );
  });

  it('returns empty conflicts array when no conflicts exist', () => {
    const result = mergeEnvMaps([local, ci]);
    expect(result.conflicts).toHaveLength(0);
  });

  it('handles empty input', () => {
    const result = mergeEnvMaps([]);
    expect(result.env).toEqual({});
    expect(result.conflicts).toHaveLength(0);
  });
});
