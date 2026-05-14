import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { loadEnv } from "./loader";

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envchain-loader-"));
}

function writeFile(dir: string, name: string, content: string): void {
  fs.writeFileSync(path.join(dir, name), content, "utf-8");
}

describe("loadEnv", () => {
  it("loads a base .env file", () => {
    const dir = makeTmpDir();
    writeFile(dir, ".env", "BASE=hello\n");
    const result = loadEnv({ cwd: dir, context: "local" });
    expect(result.env["BASE"]).toBe("hello");
    expect(result.sources).toHaveLength(1);
    expect(result.warnings).toHaveLength(0);
  });

  it("merges context-specific file over base", () => {
    const dir = makeTmpDir();
    writeFile(dir, ".env", "KEY=base\nONLY=base\n");
    writeFile(dir, ".env.staging", "KEY=staging\n");
    const result = loadEnv({ cwd: dir, context: "staging" });
    expect(result.env["KEY"]).toBe("staging");
    expect(result.env["ONLY"]).toBe("base");
    expect(result.sources).toHaveLength(2);
  });

  it("gives highest priority to .env.local", () => {
    const dir = makeTmpDir();
    writeFile(dir, ".env", "KEY=base\n");
    writeFile(dir, ".env.local", "KEY=local_override\n");
    const result = loadEnv({ cwd: dir, context: "local" });
    expect(result.env["KEY"]).toBe("local_override");
  });

  it("returns empty env when no files exist", () => {
    const dir = makeTmpDir();
    const result = loadEnv({ cwd: dir, context: "ci" });
    expect(result.env).toEqual({});
    expect(result.sources).toHaveLength(0);
  });

  it("records a warning for unreadable files", () => {
    const dir = makeTmpDir();
    const filePath = path.join(dir, ".env");
    writeFile(dir, ".env", "KEY=val\n");
    fs.chmodSync(filePath, 0o000);
    const result = loadEnv({ cwd: dir, context: "local" });
    // On some CI environments root can still read; skip assertion if readable
    if (result.sources.length === 0) {
      expect(result.warnings.length).toBeGreaterThan(0);
    }
    fs.chmodSync(filePath, 0o644);
  });

  it("sets process.env when overrideProcessEnv is true", () => {
    const dir = makeTmpDir();
    writeFile(dir, ".env", "ENVCHAIN_TEST_KEY=injected\n");
    loadEnv({ cwd: dir, context: "local", overrideProcessEnv: true });
    expect(process.env["ENVCHAIN_TEST_KEY"]).toBe("injected");
    delete process.env["ENVCHAIN_TEST_KEY"];
  });
});
