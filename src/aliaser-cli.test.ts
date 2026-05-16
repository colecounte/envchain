import { describe, it, expect, vi, beforeEach } from "vitest";
import { parseAliasCliArgs, runAliasCli, printUsage } from "./aliaser-cli";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "aliaser-cli-test-"));
}

function writeFile(dir: string, name: string, content: string): string {
  const p = path.join(dir, name);
  fs.writeFileSync(p, content, "utf-8");
  return p;
}

describe("parseAliasCliArgs", () => {
  it("parses --alias and file", () => {
    const result = parseAliasCliArgs(["--alias", "DB=DATABASE_URL", ".env"]);
    expect(result.aliasDefs).toEqual(["DB=DATABASE_URL"]);
    expect(result.file).toBe(".env");
    expect(result.removeOriginal).toBe(false);
    expect(result.dryRun).toBe(false);
  });

  it("parses --remove-original and --dry-run", () => {
    const result = parseAliasCliArgs(["--remove-original", "--dry-run", "x.env"]);
    expect(result.removeOriginal).toBe(true);
    expect(result.dryRun).toBe(true);
  });

  it("collects multiple --alias flags", () => {
    const result = parseAliasCliArgs(["--alias", "A=B", "--alias", "C=D", "file.env"]);
    expect(result.aliasDefs).toHaveLength(2);
  });
});

describe("runAliasCli", () => {
  let tmpDir: string;
  let envFile: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
    envFile = writeFile(tmpDir, ".env", "DATABASE_URL=postgres://localhost/db\nSECRET=abc\n");
  });

  it("prints output with alias applied", () => {
    const spy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});

    runAliasCli(["--alias", "DB_URL=DATABASE_URL", envFile]);

    const output = logSpy.mock.calls.map((c) => c.join("")).join("\n");
    expect(output).toContain("DB_URL");

    spy.mockRestore();
    logSpy.mockRestore();
  });

  it("prints usage for --help", () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    runAliasCli(["--help"]);
    expect(logSpy.mock.calls.some((c) => c.join("").includes("alias"))).toBe(true);
    logSpy.mockRestore();
  });

  it("exits with error when no file given", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const exitSpy = vi.spyOn(process, "exit").mockImplementation((() => {}) as any);
    runAliasCli(["--alias", "A=B"]);
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
  });
});
