import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { parseCompareArgs, runCompareCli } from './comparator-cli';

function makeTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envchain-compare-'));
}

function writeFile(dir: string, name: string, content: string) {
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, content);
  return filePath;
}

describe('parseCompareArgs', () => {
  it('parses base and target files', () => {
    const opts = parseCompareArgs(['node', 'cli', 'base.env', 'target.env']);
    expect(opts.baseFile).toBe('base.env');
    expect(opts.targetFile).toBe('target.env');
    expect(opts.verbose).toBe(false);
    expect(opts.summary).toBe(false);
  });

  it('parses --verbose flag', () => {
    const opts = parseCompareArgs(['node', 'cli', 'a.env', 'b.env', '--verbose']);
    expect(opts.verbose).toBe(true);
  });

  it('parses --summary flag', () => {
    const opts = parseCompareArgs(['node', 'cli', 'a.env', 'b.env', '-s']);
    expect(opts.summary).toBe(true);
  });

  it('returns help flag', () => {
    const opts = parseCompareArgs(['node', 'cli', '--help']);
    expect(opts.help).toBe(true);
  });
});

describe('runCompareCli', () => {
  let tmpDir: string;
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    tmpDir = makeTmpDir();
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
    fs.rmSync(tmpDir, { recursive: true });
  });

  it('prints diff between two env files', async () => {
    const base = writeFile(tmpDir, 'base.env', 'A=1\nB=old\n');
    const target = writeFile(tmpDir, 'target.env', 'A=1\nC=new\n');
    await runCompareCli(['node', 'cli', base, target]);
    const output = logSpy.mock.calls.map((c: string[]) => c[0]).join('\n');
    expect(output).toContain('+ C=new');
    expect(output).toContain('- B=old');
  });

  it('prints summary with --summary flag', async () => {
    const base = writeFile(tmpDir, 'base.env', 'A=1\n');
    const target = writeFile(tmpDir, 'target.env', 'B=2\n');
    await runCompareCli(['node', 'cli', base, target, '--summary']);
    const output = logSpy.mock.calls[0][0];
    expect(output).toContain('added');
    expect(output).toContain('removed');
  });

  it('prints no differences for identical files', async () => {
    const base = writeFile(tmpDir, 'base.env', 'A=1\n');
    const target = writeFile(tmpDir, 'target.env', 'A=1\n');
    await runCompareCli(['node', 'cli', base, target]);
    expect(logSpy).toHaveBeenCalledWith('No differences found.');
  });
});
