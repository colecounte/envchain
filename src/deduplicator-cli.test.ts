import { describe, it, expect, vi, beforeEach } from "vitest";
import { parseDedupeArgs, runDedupeCli } from "./deduplicator-cli";
import { mkdtempSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

function makeTmpDir(): string {
  return mkdtempSync(join(tmpdir(), "envchain-dedup-"));
}

function writeFile(dir: string, name: string, content: string): string {
  const p = join(dir, name);
  writeFileSync(p, content, "utf8");
  return p;
}

describe("parseDedupeArgs", () => {
  it("parses file arguments", () => {
    const opts = parseDedupeArgs(["a.env", "b.env"]);
    expect(opts.files).toEqual(["a.env", "b.env"]);
    expect(opts.strategy).toBe("last-wins");
    expect(opts.format).toBe("dotenv");
    expect(opts.showDuplicates).toBe(false);
  });

  it("parses --strategy flag", () => {
    const opts = parseDedupeArgs(["--strategy", "first-wins", "a.env"]);
    expect(opts.strategy).toBe("first-wins");
  });

  it("parses --format flag", () => {
    const opts = parseDedupeArgs(["--format", "json", "a.env"]);
    expect(opts.format).toBe("json");
  });

  it("parses --show-duplicates flag", () => {
    const opts = parseDedupeArgs(["--show-duplicates", "a.env"]);
    expect(opts.showDuplicates).toBe(true);
  });

  it("parses --help flag", () => {
    const opts = parseDedupeArgs(["--help"]);
    expect(opts.help).toBe(true);
  });
});

describe("runDedupeCli", () => {
  let dir: string;
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errSpy: ReturnType<typeof vi.spyOn>;
  let exitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    dir = makeTmpDir();
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    exitSpy = vi.spyOn(process, "exit").mockImplementation((() => {}) as never);
  });

  it("merges two files with last-wins", () => {
    const f1 = writeFile(dir, ".env.base", "FOO=1\nBAR=x\n");
    const f2 = writeFile(dir, ".env.local", "FOO=2\n");
    runDedupeCli([f1, f2]);
    const out = (logSpy.mock.calls[0][0] as string);
    expect(out).toContain("FOO=2");
    expect(out).toContain("BAR=x");
  });

  it("shows duplicates on stderr when --show-duplicates", () => {
    const f1 = writeFile(dir, ".env.a", "FOO=1\n");
    const f2 = writeFile(dir, ".env.b", "FOO=2\n");
    runDedupeCli(["--show-duplicates", f1, f2]);
    const errOut = errSpy.mock.calls.map((c) => c[0]).join("\n");
    expect(errOut).toContain("FOO");
  });

  it("exits with error on error strategy with duplicates", () => {
    const f1 = writeFile(dir, ".env.x", "FOO=1\n");
    const f2 = writeFile(dir, ".env.y", "FOO=2\n");
    runDedupeCli(["--strategy", "error", f1, f2]);
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("shows help and exits 0 for --help", () => {
    runDedupeCli(["--help"]);
    expect(exitSpy).toHaveBeenCalledWith(0);
  });
});
