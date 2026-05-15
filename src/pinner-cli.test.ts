import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { mkdtempSync, rmSync, readFileSync, existsSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { runPinCli } from "./pinner-cli";

function makeTmpDir(): string {
  return mkdtempSync(join(tmpdir(), "envchain-pin-"));
}

describe("runPinCli", () => {
  let dir: string;
  let pinFile: string;
  let logs: string[];
  let errors: string[];

  beforeEach(() => {
    dir = makeTmpDir();
    pinFile = join(dir, "pins.json");
    logs = [];
    errors = [];
    console.log = (...args: unknown[]) => logs.push(args.join(" "));
    console.error = (...args: unknown[]) => errors.push(args.join(" "));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("prints usage with --help", () => {
    runPinCli(["node", "envchain", "--help"]);
    expect(logs.some((l) => l.includes("Usage"))).toBe(true);
  });

  it("adds a pin and writes to file", () => {
    runPinCli(["node", "envchain", "add", "API_KEY=secret", "--file", pinFile]);
    expect(logs[0]).toContain("Pinned API_KEY=secret");
    const data = JSON.parse(readFileSync(pinFile, "utf-8"));
    expect(data["API_KEY"].value).toBe("secret");
  });

  it("removes a pin", () => {
    runPinCli(["node", "envchain", "add", "DB_URL=postgres", "--file", pinFile]);
    runPinCli(["node", "envchain", "remove", "DB_URL", "--file", pinFile]);
    expect(logs[1]).toContain("Unpinned DB_URL");
    const data = JSON.parse(readFileSync(pinFile, "utf-8"));
    expect(data["DB_URL"]).toBeUndefined();
  });

  it("lists pins", () => {
    runPinCli(["node", "envchain", "add", "FOO=bar", "--file", pinFile]);
    runPinCli(["node", "envchain", "list", "--file", pinFile]);
    expect(logs.some((l) => l.includes("FOO"))).toBe(true);
  });

  it("list shows empty message when no pins", () => {
    runPinCli(["node", "envchain", "list", "--file", pinFile]);
    expect(logs[0]).toBe("No pinned keys.");
  });

  it("errors on add without KEY=VALUE", () => {
    expect(() =>
      runPinCli(["node", "envchain", "add", "BADKEY", "--file", pinFile])
    ).toThrow();
    expect(errors[0]).toContain("add requires KEY=VALUE");
  });

  it("errors on remove without KEY", () => {
    expect(() =>
      runPinCli(["node", "envchain", "remove", "--file", pinFile])
    ).toThrow();
  });

  it("handles missing pin file gracefully on list", () => {
    runPinCli(["node", "envchain", "list", "--file", join(dir, "nonexistent.json")]);
    expect(logs[0]).toBe("No pinned keys.");
  });
});
