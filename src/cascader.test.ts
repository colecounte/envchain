import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { cascadeEnv, cascadeOrder, formatCascadeResult } from './cascader';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'cascader-test-'));
}

function writeFile(dir: string, name: string, content: string): void {
  fs.writeFileSync(path.join(dir, name), content, 'utf-8');
}

describe('cascadeOrder', () => {
  it('includes base and context', () => {
    const order = cascadeOrder('staging');
    expect(order).toContain('base');
    expect(order).toContain('staging');
  });

  it('appends local for non-local contexts', () => {
    const order = cascadeOrder('ci');
    expect(order[order.length - 1]).toBe('local');
  });

  it('does not duplicate local for local context', () => {
    const order = cascadeOrder('local');
    const localCount = order.filter(c => c === 'local').length;
    expect(localCount).toBe(1);
  });
});

describe('cascadeEnv', () => {
  let tmpDir: string;

  beforeEach(() => { tmpDir = makeTmpDir(); });
  afterEach(() => { fs.rmSync(tmpDir, { recursive: true }); });

  it('merges base and context files', async () => {
    writeFile(tmpDir, '.env', 'BASE=1\nSHARED=base');
    writeFile(tmpDir, '.env.staging', 'STAGING=yes\nSHARED=staging');
    const result = await cascadeEnv({ context: 'staging', baseDir: tmpDir });
    expect(result.merged.get('BASE')).toBe('1');
    expect(result.merged.get('STAGING')).toBe('yes');
    expect(result.merged.get('SHARED')).toBe('staging');
    expect(result.sources.length).toBeGreaterThanOrEqual(1);
  });

  it('local overrides staging', async () => {
    writeFile(tmpDir, '.env.staging', 'KEY=staging');
    writeFile(tmpDir, '.env.local', 'KEY=local');
    const result = await cascadeEnv({ context: 'staging', baseDir: tmpDir });
    expect(result.merged.get('KEY')).toBe('local');
  });

  it('records skipped files', async () => {
    writeFile(tmpDir, '.env', 'ONLY=base');
    const result = await cascadeEnv({ context: 'staging', baseDir: tmpDir });
    expect(result.skipped.length).toBeGreaterThan(0);
  });

  it('throws in strict mode with no files', async () => {
    expect(cascadeEnv({ context: 'ci', baseDir: tmpDir, strict: true })).rejects.toThrow();
  });
});

describe('formatCascadeResult', () => {
  it('formats sources and skipped', () => {
    const result = { merged: new Map(), sources: ['.env', '.env.local'], skipped: ['.env.staging'] };
    const output = formatCascadeResult(result);
    expect(output).toContain('.env');
    expect(output).toContain('.env.local');
    expect(output).toContain('.env.staging');
  });
});
