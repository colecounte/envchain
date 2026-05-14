import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { main } from './cli';

async function makeTmpDir(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), 'envchain-cli-'));
}

async function writeFile(dir: string, name: string, content: string): Promise<void> {
  await fs.writeFile(path.join(dir, name), content, 'utf-8');
}

describe('cli', () => {
  let tmpDir: string;
  let consoleSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    tmpDir = await makeTmpDir();
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it('prints help with --help flag', async () => {
    await main(['node', 'envchain', '--help']);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Usage: envchain'));
  });

  it('prints resolved vars with --print flag', async () => {
    await writeFile(tmpDir, '.env', 'BASE=base_value');
    await writeFile(tmpDir, '.env.local', 'LOCAL=local_value');

    await main(['node', 'envchain', '--cwd', tmpDir, '--print', 'local']);

    const output = consoleSpy.mock.calls.map((c) => c[0]).join('\n');
    expect(output).toContain('BASE=base_value');
    expect(output).toContain('LOCAL=local_value');
  });

  it('defaults to local context when no contexts given', async () => {
    await writeFile(tmpDir, '.env.local', 'IMPLICIT=yes');

    await main(['node', 'envchain', '--cwd', tmpDir, '--print']);

    const output = consoleSpy.mock.calls.map((c) => c[0]).join('\n');
    expect(output).toContain('IMPLICIT=yes');
  });

  it('injects vars into process.env when --print is not set', async () => {
    await writeFile(tmpDir, '.env', 'INJECTED_VAR=injected');

    await main(['node', 'envchain', '--cwd', tmpDir]);

    expect(process.env['INJECTED_VAR']).toBe('injected');
    delete process.env['INJECTED_VAR'];
  });

  it('errors on unknown flags', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {}) as never);
    await main(['node', 'envchain', '--unknown']);
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Unknown option'));
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
  });
});
