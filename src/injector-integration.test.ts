import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { injectEnvMap } from "./injector";
import { parseEnvContent } from "./parser";

function makeTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envchain-inject-"));
}

function writeFile(dir: string, name: string, content: string) {
  fs.writeFileSync(path.join(dir, name), content, "utf8");
}

describe("injector integration", () => {
  it("injects parsed env file content into a target object", () => {
    const dir = makeTmpDir();
    writeFile(dir, ".env", "APP_NAME=envchain\nAPP_VERSION=1.0.0\n");
    const raw = fs.readFileSync(path.join(dir, ".env"), "utf8");
    const envMap = parseEnvContent(raw);
    const target: NodeJS.ProcessEnv = {};
    const result = injectEnvMap(envMap, target);
    expect(target["APP_NAME"]).toBe("envchain");
    expect(target["APP_VERSION"]).toBe("1.0.0");
    expect(result.injected).toContain("APP_NAME");
    expect(result.injected).toContain("APP_VERSION");
  });

  it("respects override=false when keys already exist", () => {
    const raw = "DB_HOST=localhost\nDB_PORT=5432\n";
    const envMap = parseEnvContent(raw);
    const target: NodeJS.ProcessEnv = { DB_HOST: "remotehost" };
    injectEnvMap(envMap, target, { override: false });
    expect(target["DB_HOST"]).toBe("remotehost");
    expect(target["DB_PORT"]).toBe("5432");
  });

  it("prefixes all keys correctly from a real env parse", () => {
    const raw = "SECRET=abc123\nTOKEN=xyz\n";
    const envMap = parseEnvContent(raw);
    const target: NodeJS.ProcessEnv = {};
    injectEnvMap(envMap, target, { prefix: "PROD_" });
    expect(target["PROD_SECRET"]).toBe("abc123");
    expect(target["PROD_TOKEN"]).toBe("xyz");
    expect(target["SECRET"]).toBeUndefined();
  });
});
