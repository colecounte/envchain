import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { parseMergeArgs, runMergeCli } from "./merger-cli";

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envchain-merger-cli-"));
}

function writeFile(dir: string, name: string, content: string): string {
  const p = path.join(dir, name);
  fs.writeFileSync(p, content, "utf8");
  return p;
}

describe("parseMergeArgs", () => {
  it("parses file list", () => {
    const args = parseMergeArgs([".env", ".env.local"]);
    expect(args.files).toEqual([".env", ".env.local"]);
    expect(args.format).toBe("dotenv");
    expect(args.output).toBeNull();
    expect(args.strategy).toBe("last-wins");
  });

  it("parses --format flag", () => {
    const args = parseMergeArgs([".env", ".env.ci", "--format", "json"]);
    expect(args.format).toBe("json");
  });

  it("parses --output flag", () => {
    const args = parseMergeArgs([".env", ".env.local", "--output", "out.env"]);
    expect(args.output).toBe("out.env");
  });

  it("parses --strategy first-wins", () => {
    const args = parseMergeArgs([".env", ".env.local", "--strategy", "first-wins"]);
    expect(args.strategy).toBe("first-wins");
  });
});

describe("runMergeCli", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("merges two files to stdout (last-wins)", () => {
    const a = writeFile(tmpDir, "a.env", "FOO=base\nBAR=hello\n");
    const b = writeFile(tmpDir, "b.env", "FOO=override\nBAZ=world\n");
    const out: string[] = [];
    const orig = process.stdout.write.bind(process.stdout);
    (process.stdout as any).write = (s: string) => { out.push(s); return true; };
    runMergeCli([a, b]);
    (process.stdout as any).write = orig;
    const combined = out.join("");
    expect(combined).toContain("FOO=override");
    expect(combined).toContain("BAR=hello");
    expect(combined).toContain("BAZ=world");
  });

  it("writes merged output to file with --output", () => {
    const a = writeFile(tmpDir, "a.env", "KEY=alpha\n");
    const b = writeFile(tmpDir, "b.env", "KEY=beta\nEXTRA=yes\n");
    const outFile = path.join(tmpDir, "merged.env");
    runMergeCli([a, b, "--output", outFile]);
    const content = fs.readFileSync(outFile, "utf8");
    expect(content).toContain("KEY=beta");
    expect(content).toContain("EXTRA=yes");
  });

  it("respects first-wins strategy", () => {
    const a = writeFile(tmpDir, "a.env", "KEY=first\n");
    const b = writeFile(tmpDir, "b.env", "KEY=second\n");
    const outFile = path.join(tmpDir, "out.env");
    runMergeCli([a, b, "--strategy", "first-wins", "--output", outFile]);
    const content = fs.readFileSync(outFile, "utf8");
    expect(content).toContain("KEY=first");
  });

  it("outputs json format", () => {
    const a = writeFile(tmpDir, "a.env", "X=1\n");
    const b = writeFile(tmpDir, "b.env", "Y=2\n");
    const outFile = path.join(tmpDir, "out.json");
    runMergeCli([a, b, "--format", "json", "--output", outFile]);
    const parsed = JSON.parse(fs.readFileSync(outFile, "utf8"));
    expect(parsed).toMatchObject({ X: "1", Y: "2" });
  });
});
