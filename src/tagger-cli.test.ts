import { describe, it, expect, vi, beforeEach } from "vitest";
import { parseTagArgs, runTagCli } from "./tagger-cli";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

function makeTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envchain-tagger-"));
}

function writeFile(dir: string, name: string, content: string) {
  fs.writeFileSync(path.join(dir, name), content, "utf-8");
}

describe("parseTagArgs", () => {
  it("returns null for --help", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const result = parseTagArgs(["node", "tagger", "--help"]);
    expect(result).toBeNull();
    consoleSpy.mockRestore();
  });

  it("parses --add correctly", () => {
    const result = parseTagArgs(["node", "tagger", ".env", "--add", "DB_PASS", "secret"]);
    expect(result?.adds).toEqual([{ key: "DB_PASS", tag: "secret" }]);
  });

  it("parses --remove correctly", () => {
    const result = parseTagArgs(["node", "tagger", ".env", "--remove", "OLD_KEY", "deprecated"]);
    expect(result?.removes).toEqual([{ key: "OLD_KEY", tag: "deprecated" }]);
  });

  it("parses --filter correctly", () => {
    const result = parseTagArgs(["node", "tagger", ".env", "--filter", "required"]);
    expect(result?.filter).toBe("required");
  });

  it("parses --list correctly", () => {
    const result = parseTagArgs(["node", "tagger", ".env", "--list"]);
    expect(result?.list).toBe(true);
  });
});

describe("runTagCli", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  it("filters keys by tag and prints them", () => {
    writeFile(tmpDir, ".env", "DB_PASS=secret123\nAPP_NAME=myapp\n");
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    runTagCli([
      "node", "tagger",
      path.join(tmpDir, ".env"),
      "--add", "DB_PASS", "secret",
      "--filter", "secret",
    ]);
    expect(consoleSpy).toHaveBeenCalledWith("DB_PASS=secret123");
    expect(consoleSpy).not.toHaveBeenCalledWith("APP_NAME=myapp");
    consoleSpy.mockRestore();
  });

  it("lists tag map as JSON", () => {
    writeFile(tmpDir, ".env", "KEY=value\n");
    const logs: string[] = [];
    const consoleSpy = vi.spyOn(console, "log").mockImplementation((msg) => logs.push(msg));
    runTagCli([
      "node", "tagger",
      path.join(tmpDir, ".env"),
      "--add", "KEY", "required",
      "--list",
    ]);
    const parsed = JSON.parse(logs.join(""));
    expect(parsed["KEY"]).toContain("required");
    consoleSpy.mockRestore();
  });
});
