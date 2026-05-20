import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { parseArchiveArgs } from "./archiver-cli";
import { archiveEnvMap, listArchives } from "./archiver";

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envchain-archiver-cli-"));
}

function writeFile(dir: string, name: string, content: string): string {
  const p = path.join(dir, name);
  fs.writeFileSync(p, content, "utf8");
  return p;
}

describe("parseArchiveArgs", () => {
  it("defaults command to list", () => {
    const result = parseArchiveArgs(["node", "archiver"]);
    expect(result.command).toBe("list");
  });

  it("parses save command with file", () => {
    const result = parseArchiveArgs(["node", "archiver", "save", ".env.local"]);
    expect(result.command).toBe("save");
    expect(result.file).toBe(".env.local");
  });

  it("parses --context flag", () => {
    const result = parseArchiveArgs([
      "node", "archiver", "save", ".env", "--context", "staging",
    ]);
    expect(result.context).toBe("staging");
  });

  it("parses --dir flag", () => {
    const result = parseArchiveArgs([
      "node", "archiver", "list", "--dir", "/tmp/mydir",
    ]);
    expect(result.dir).toBe("/tmp/mydir");
  });

  it("parses restore command with filename", () => {
    const result = parseArchiveArgs([
      "node", "archiver", "restore", "local-2024-01-01.env",
    ]);
    expect(result.command).toBe("restore");
    expect(result.filename).toBe("local-2024-01-01.env");
  });

  it("defaults context to local", () => {
    const result = parseArchiveArgs(["node", "archiver", "list"]);
    expect(result.context).toBe("local");
  });
});

describe("archiver integration", () => {
  it("round-trips save and list", () => {
    const dir = makeTmpDir();
    const map = { API_KEY: "secret", PORT: "3000" };
    archiveEnvMap(map, "ci", dir);
    const entries = listArchives(dir, "ci");
    expect(entries).toHaveLength(1);
    expect(entries[0].keys).toContain("API_KEY");
    expect(entries[0].keys).toContain("PORT");
  });

  it("saves env file and archives correctly", () => {
    const dir = makeTmpDir();
    writeFile(dir, ".env.local", "FOO=bar\nBAZ=qux\n");
    archiveEnvMap({ FOO: "bar", BAZ: "qux" }, "local", dir);
    const entries = listArchives(dir);
    expect(entries.length).toBeGreaterThan(0);
  });
});
