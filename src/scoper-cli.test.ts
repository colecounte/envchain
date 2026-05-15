import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { parseScopeArgs, printUsage, runScopeCli } from './scoper-cli';
import { mkdtempSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

function makeTmpDir(): string {
  return mkdtempSync(join(tmpdir(), 'envchain-scoper-'));
}

function writeFile(dir: string, name: string, content: string): string {
  const p = join(dir, name);
  writeFileSync(p, content);
  return p;
}

describe('parseScopeArgs', () => {
  it('parses extract command', () => {
    const result = parseScopeArgs(['extract', 'DB']);
    expect(result).toMatchObject({ command: 'extract', scope: 'DB', file: '.env' });
  });

  it('parses apply command with custom file', () => {
    const result = parseScopeArgs(['apply', 'APP', '--file', '.env.local']);
    expect(result).toMatchObject({ command: 'apply', scope: 'APP', file: '.env.local' });
  });

  it('parses detect command', () => {
    const result = parseScopeArgs(['detect']);
    expect(result).toMatchObject({ command: 'detect', file: '.env' });
  });

  it('returns null for unknown command', () => {
    expect(parseScopeArgs(['unknown'])).toBeNull();
  });

  it('returns null for extract without scope', () => {
    expect(parseScopeArgs(['extract'])).toBeNull();
  });

  it('returns null for empty args', () => {
    expect(parseScopeArgs([])).toBeNull();
  });
});

describe('runScopeCli', () => {
  let tmpDir: string;
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    tmpDir = makeTmpDir();
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('extracts scoped keys from file', () => {
    const file = writeFile(tmpDir, '.env', 'DB_HOST=localhost\nDB_PORT=5432\nAPP_NAME=test\n');
    runScopeCli(['extract', 'DB', '--file', file]);
    const output = consoleSpy.mock.calls[0][0] as string;
    expect(output).toContain('HOST=localhost');
    expect(output).toContain('PORT=5432');
    expect(output).not.toContain('APP_NAME');
  });

  it('applies scope prefix to all keys', () => {
    const file = writeFile(tmpDir, '.env', 'HOST=localhost\nPORT=5432\n');
    runScopeCli(['apply', 'DB', '--file', file]);
    const output = consoleSpy.mock.calls[0][0] as string;
    expect(output).toContain('DB_HOST=localhost');
    expect(output).toContain('DB_PORT=5432');
  });

  it('detects scopes in file', () => {
    const file = writeFile(tmpDir, '.env', 'DB_HOST=a\nAPP_NAME=b\nPLAIN=c\n');
    runScopeCli(['detect', '--file', file]);
    const output = consoleSpy.mock.calls[0][0] as string;
    expect(output).toContain('APP');
    expect(output).toContain('DB');
  });

  it('reports no scopes when none found', () => {
    const file = writeFile(tmpDir, '.env', 'FOO=bar\n');
    runScopeCli(['detect', '--file', file]);
    expect(consoleSpy.mock.calls[0][0]).toContain('No scopes detected');
  });
});
