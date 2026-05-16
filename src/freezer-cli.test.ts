import { describe, it, expect, spyOn, beforeEach } from "bun:test";
import { mkdtempSync, writeFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { runFreezeCli, printUsage } from "./freezer-cli";

function makeTmpDir(): string {
  return mkdtempSync(join(tmpdir(), "freezer-cli-test-"));
}

function writeFile(dir: string, name: string, content: string): string {
  const p = join(dir, name);
  writeFileSync(p, content);
  return p;
}

describe("printUsage", () => {
  it("logs usage info", () => {
    const spy = spyOn(console, "log");
    printUsage();
    expect(spy).toHaveBeenCalled();
  });
});

describe("runFreezeCli", () => {
  let dir: string;
  beforeEach(() => {
    dir = makeTmpDir();
  });

  it("prints usage with no args", () => {
    const spy = spyOn(console, "log");
    runFreezeCli([]);
    expect(spy).toHaveBeenCalled();
  });

  it("freeze command outputs JSON record", () => {
    const envFile = writeFile(dir, ".env", "FOO=bar\nBAZ=qux\n");
    const logs: string[] = [];
    spyOn(console, "log").mockImplementation((msg) => logs.push(msg));
    runFreezeCli(["freeze", envFile, "--context", "staging"]);
    const parsed = JSON.parse(logs[0]);
    expect(parsed.context).toBe("staging");
    expect(parsed.map.FOO).toBe("bar");
    expect(typeof parsed.frozenAt).toBe("string");
  });

  it("freeze uses default context when not specified", () => {
    const envFile = writeFile(dir, ".env", "A=1\n");
    const logs: string[] = [];
    spyOn(console, "log").mockImplementation((msg) => logs.push(msg));
    runFreezeCli(["freeze", envFile]);
    const parsed = JSON.parse(logs[0]);
    expect(parsed.context).toBe("default");
  });

  it("drift command reports no drift when maps match", () => {
    const envFile = writeFile(dir, ".env", "FOO=bar\n");
    const logs: string[] = [];
    spyOn(console, "log").mockImplementation((msg) => logs.push(String(msg)));
    // First freeze
    runFreezeCli(["freeze", envFile]);
    const frozenJson = writeFile(dir, "frozen.json", logs[0]);
    logs.length = 0;
    runFreezeCli(["drift", frozenJson, envFile]);
    expect(logs.join(" ")).toContain("No drift");
  });

  it("drift command reports drift when maps differ", () => {
    const envFile = writeFile(dir, ".env", "FOO=bar\n");
    const logs: string[] = [];
    spyOn(console, "log").mockImplementation((msg) => logs.push(String(msg)));
    runFreezeCli(["freeze", envFile]);
    const frozenJson = writeFile(dir, "frozen.json", logs[0]);
    const changedFile = writeFile(dir, ".env.changed", "FOO=changed\n");
    logs.length = 0;
    runFreezeCli(["drift", frozenJson, changedFile]);
    expect(logs.join(" ")).toContain("Drift detected");
  });
});
