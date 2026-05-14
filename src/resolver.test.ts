import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { resolveEnv, resolveEnvToProcess } from './resolver';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envchain-'));
}

function writeFile(dir: string, name: string, content: string): void {
  fs.writeFileSync(path.join(dir, name), content, 'utf-8');
}

describe('resolveEnv', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns empty object when no env files exist', () => {
    const result = resolveEnv({ baseDir: tmpDir });
    expect(result).toEqual({});
  });

  it('reads base .env file', () => {
    writeFile(tmpDir, '.env', 'APP_NAME=envchain\nPORT=3000');
    const result = resolveEnv({ baseDir: tmpDir });
    expect(result).toEqual({ APP_NAME: 'envchain', PORT: '3000' });
  });

  it('merges context file over base .env', () => {
    writeFile(tmpDir, '.env', 'PORT=3000\nDB_HOST=localhost');
    writeFile(tmpDir, '.env.staging', 'PORT=8080\nDB_HOST=staging.db');
    const result = resolveEnv({ baseDir: tmpDir, contexts: ['staging'] });
    expect(result.PORT).toBe('8080');
    expect(result.DB_HOST).toBe('staging.db');
  });

  it('cascades multiple contexts in order', () => {
    writeFile(tmpDir, '.env', 'A=base\nB=base');
    writeFile(tmpDir, '.env.staging', 'A=staging');
    writeFile(tmpDir, '.env.ci', 'B=ci');
    const result = resolveEnv({ baseDir: tmpDir, contexts: ['staging', 'ci'] });
    expect(result.A).toBe('staging');
    expect(result.B).toBe('ci');
  });

  it('applies programmatic override last', () => {
    writeFile(tmpDir, '.env', 'SECRET=from-file');
    const result = resolveEnv({ baseDir: tmpDir, override: { SECRET: 'from-override' } });
    expect(result.SECRET).toBe('from-override');
  });

  it('resolveEnvToProcess does not overwrite existing process.env keys', () => {
    writeFile(tmpDir, '.env', 'EXISTING_KEY=new-value');
    process.env.EXISTING_KEY = 'original';
    resolveEnvToProcess({ baseDir: tmpDir });
    expect(process.env.EXISTING_KEY).toBe('original');
    delete process.env.EXISTING_KEY;
  });
});
