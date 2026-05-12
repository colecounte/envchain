import { parseEnvContent, parseEnvFile, EnvMap } from './parser';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('parseEnvContent', () => {
  it('parses simple key=value pairs', () => {
    const map = parseEnvContent('FOO=bar\nBAZ=qux', 'test');
    expect(map.get('FOO')).toEqual({ key: 'FOO', value: 'bar', source: 'test' });
    expect(map.get('BAZ')).toEqual({ key: 'BAZ', value: 'qux', source: 'test' });
  });

  it('ignores comment lines', () => {
    const map = parseEnvContent('# this is a comment\nFOO=bar', 'test');
    expect(map.size).toBe(1);
    expect(map.has('FOO')).toBe(true);
  });

  it('ignores blank lines', () => {
    const map = parseEnvContent('\n\nFOO=bar\n\n', 'test');
    expect(map.size).toBe(1);
  });

  it('strips double quotes from values', () => {
    const map = parseEnvContent('FOO="hello world"', 'test');
    expect(map.get('FOO')?.value).toBe('hello world');
  });

  it('strips single quotes from values', () => {
    const map = parseEnvContent("FOO='hello world'", 'test');
    expect(map.get('FOO')?.value).toBe('hello world');
  });

  it('handles values containing = signs', () => {
    const map = parseEnvContent('URL=http://example.com?a=1&b=2', 'test');
    expect(map.get('URL')?.value).toBe('http://example.com?a=1&b=2');
  });

  it('skips lines without = sign', () => {
    const map = parseEnvContent('INVALID_LINE\nFOO=bar', 'test');
    expect(map.size).toBe(1);
    expect(map.has('FOO')).toBe(true);
  });

  it('attaches the source to each entry', () => {
    const map = parseEnvContent('KEY=val', 'my-source');
    expect(map.get('KEY')?.source).toBe('my-source');
  });
});

describe('parseEnvFile', () => {
  it('returns an empty map for non-existent files', () => {
    const map = parseEnvFile('/non/existent/.env');
    expect(map.size).toBe(0);
  });

  it('reads and parses a real file', () => {
    const tmpFile = path.join(os.tmpdir(), '.env-test-envchain');
    fs.writeFileSync(tmpFile, 'APP_ENV=test\nDEBUG=true');

    const map = parseEnvFile(tmpFile);
    expect(map.get('APP_ENV')?.value).toBe('test');
    expect(map.get('DEBUG')?.value).toBe('true');

    fs.unlinkSync(tmpFile);
  });
});
