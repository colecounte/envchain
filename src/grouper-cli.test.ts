import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { parseGroupArgs, runGroupCli } from "./grouper-cli";

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envchain-grouper-"));
}

function writeFile(dir: string, name: string, content: string): string {
  const p = path.join(dir, name);
  fs.writeFileSync(p, content);
  return p;
}

describe("parseGroupArgs", () => {
  it("parses file argument", () => {
    const opts = parseGroupArgs([".env"]);
    expect(opts.file).toBe(".env");
    expect(opts.separator).toBe("_");
    expect(opts.help).toBe(false);
  });

  it("parses separator option", () => {
    const opts = parseGroupArgs(["--separator", ".", ".env"]);
    expect(opts.separator).toBe(".");
  });

  it("parses pattern options", () => {
    const opts = parseGroupArgs(["--pattern", "db=^DB_", "--pattern", "aws=^AWS_", ".env"]);
    expect(opts.patterns["db"]).toBeInstanceOf(RegExp);
    expect(opts.patterns["aws"]).toBeInstanceOf(RegExp);
  });

  it("sets help flag", () => {
    const opts = parseGroupArgs(["--help"]);
    expect(opts.help).toBe(true);
  });
});

describe("runGroupCli", () => {
  let tmpDir: string;
  let logs: string[];
  const origLog = console.log;

  beforeEach(() => {
    tmpDir = makeTmpDir();
    logs = [];
    console.log = (...args: unknown[]) => logs.push(args.join(" "));
  });

  afterEach(() => {
    console.log = origLog;
    fs.rmSync(tmpDir, { recursive: true });
  });

  it("groups by prefix and prints output", () => {
    const file = writeFile(tmpDir, ".env", "DB_HOST=localhost\nDB_PORT=5432\nAPP_NAME=myapp\n");
    runGroupCli([file]);
    const output = logs.join("\n");
    expect(output).toContain("[DB]");
    expect(output).toContain("DB_HOST=localhost");
    expect(output).toContain("[APP]");
  });

  it("groups by pattern when patterns provided", () => {
    const file = writeFile(tmpDir, ".env", "DB_HOST=localhost\nAWS_KEY=key\nPORT=3000\n");
    runGroupCli(["--pattern", "db=^DB_", "--pattern", "aws=^AWS_", file]);
    const output = logs.join("\n");
    expect(output).toContain("[db]");
    expect(output).toContain("[aws]");
  });

  it("prints help when --help passed", () => {
    runGroupCli(["--help"]);
    expect(logs.join("\n")).toContain("Group environment variables");
  });
});
