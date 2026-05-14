import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { exportEnvMap, inferFormat } from './exporter';
import { EnvMap } from './merger';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envchain-exporter-'));
}

function makeMap(entries: Record<string, string>): EnvMap {
  return new Map(Object.entries(entries));
}

describe('inferFormat', () => {
  it('returns json for .json extension', () => {
    expect(inferFormat('output.json')).toBe('json');
  });

  it('returns csv for .csv extension', () => {
    expect(inferFormat('output.csv')).toBe('csv');
  });

  it('returns export for .sh extension', () => {
    expect(inferFormat('setup.sh')).toBe('export');
  });

  it('returns dotenv for .env extension', () => {
    expect(inferFormat('.env')).toBe('dotenv');
  });

  it('returns dotenv for unknown extension', () => {
    expect(inferFormat('output.txt')).toBe('dotenv');
  });
});

describe('exportEnvMap', () => {
  it('returns formatted content without writing file', () => {
    const map = makeMap({ FOO: 'bar', BAZ: 'qux' });
    const result = exportEnvMap(map, { format: 'dotenv' });
    expect(result).toContain('FOO=bar');
    expect(result).toContain('BAZ=qux');
  });

  it('writes content to output file', () => {
    const tmp = makeTmpDir();
    const outPath = path.join(tmp, 'output.env');
    const map = makeMap({ KEY: 'value' });
    exportEnvMap(map, { format: 'dotenv', outputPath: outPath });
    const written = fs.readFileSync(outPath, 'utf8');
    expect(written).toContain('KEY=value');
  });

  it('throws if file exists and overwrite is false', () => {
    const tmp = makeTmpDir();
    const outPath = path.join(tmp, 'existing.env');
    fs.writeFileSync(outPath, 'OLD=data', 'utf8');
    const map = makeMap({ NEW: 'data' });
    expect(() =>
      exportEnvMap(map, { format: 'dotenv', outputPath: outPath, overwrite: false })
    ).toThrow(/already exists/);
  });

  it('overwrites file when overwrite is true', () => {
    const tmp = makeTmpDir();
    const outPath = path.join(tmp, 'existing.env');
    fs.writeFileSync(outPath, 'OLD=data', 'utf8');
    const map = makeMap({ NEW: 'value' });
    exportEnvMap(map, { format: 'dotenv', outputPath: outPath, overwrite: true });
    const written = fs.readFileSync(outPath, 'utf8');
    expect(written).toContain('NEW=value');
    expect(written).not.toContain('OLD=data');
  });

  it('creates nested directories if they do not exist', () => {
    const tmp = makeTmpDir();
    const outPath = path.join(tmp, 'nested', 'dir', 'output.json');
    const map = makeMap({ A: '1' });
    exportEnvMap(map, { format: 'json', outputPath: outPath });
    expect(fs.existsSync(outPath)).toBe(true);
  });
});
