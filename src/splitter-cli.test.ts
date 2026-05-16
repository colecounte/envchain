import { describe, it, expect, vi, beforeEach } from "vitest";
import { mkdtempSync, writeFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { parseSplitArgs, runSplitCli } from "./splitter-cli";

function makeTmpDir(): string {
  return mkdtempSync(join(tmpdir(), "envchain-split-"));
}

function writeFile(dir: string, name: string, content: string): string {
  const p = join(dir, name);
  writeFileSync(p, content, "utf-8");
  return p;
}

describe("parseSplitArgs", () => {
  it("parses --file and --prefix", () => {
    const args = parseSplitArgs(["--file", ".env", "--prefix", "DB,APP"]);
    expect(args.file).toBe(".env");
    expect(args.prefixes).toEqual(["DB", "APP"]);
  });

  it("parses --pattern", () => {
    const args = parseSplitArgs(["--pattern", "sec=^SECRET_,net=^PORT$"]);
    expect(args.patterns).toBeDefined();
    expect(args.patterns!["sec"]).toBeInstanceOf(RegExp);
    expect(args.patterns!["net"].source).toBe("^PORT$");
  });

  it("returns empty object for no args", () => {
    const args = parseSplitArgs([]);
    expect(args.file).toBeUndefined();
  });
});

describe("runSplitCli", () => {
  let dir: string;
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    dir = makeTmpDir();
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("prints help with --help", () => {
    runSplitCli(["--help"]);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("Split env vars"));
  });

  it("splits by prefix and prints result", () => {
    const file = writeFile(dir, ".env", "DB_HOST=localhost\nAPP_NAME=myapp\nOTHER=val\n");
    runSplitCli(["--file", file, "--prefix", "DB,APP"]);
    const output = logSpy.mock.calls.map((c) => c[0]).join("\n");
    expect(output).toContain("[DB]");
    expect(output).toContain("HOST=localhost");
    expect(output).toContain("[APP]");
    expect(output).toContain("NAME=myapp");
  });

  it("splits by pattern and prints result", () => {
    const file = writeFile(dir, ".env", "SECRET_KEY=abc\nPORT=3000\n");
    runSplitCli(["--file", file, "--pattern", "sec=^SECRET_,net=^PORT$"]);
    const output = logSpy.mock.calls.map((c) => c[0]).join("\n");
    expect(output).toContain("[sec]");
    expect(output).toContain("[net]");
  });

  it("errors when --file is missing", () => {
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => { throw new Error("exit"); });
    expect(() => runSplitCli(["--prefix", "DB"])).toThrow("exit");
    expect(errSpy).toHaveBeenCalledWith(expect.stringContaining("--file is required"));
    exitSpy.mockRestore();
  });
});
