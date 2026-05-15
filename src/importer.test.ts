import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {
  inferImportFormat,
  importFromDotenv,
  importFromJson,
  importFromCsv,
  importFromExport,
  importEnvMap,
  importEnvFile,
} from "./importer";

function makeTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envchain-importer-"));
}

describe("inferImportFormat", () => {
  it("returns json for .json", () => expect(inferImportFormat("env.json")).toBe("json"));
  it("returns csv for .csv", () => expect(inferImportFormat("env.csv")).toBe("csv"));
  it("returns export for .sh", () => expect(inferImportFormat("env.sh")).toBe("export"));
  it("returns dotenv by default", () => expect(inferImportFormat(".env")).toBe("dotenv"));
});

describe("importFromDotenv", () => {
  it("parses key=value pairs", () => {
    const map = importFromDotenv("FOO=bar\nBAZ=qux\n");
    expect(map.get("FOO")).toBe("bar");
    expect(map.get("BAZ")).toBe("qux");
  });

  it("ignores comment lines", () => {
    const map = importFromDotenv("# comment\nKEY=val\n");
    expect(map.size).toBe(1);
  });
});

describe("importFromJson", () => {
  it("parses flat JSON object", () => {
    const map = importFromJson(JSON.stringify({ A: "1", B: "2" }));
    expect(map.get("A")).toBe("1");
    expect(map.get("B")).toBe("2");
  });

  it("throws for non-object JSON", () => {
    expect(() => importFromJson("[1,2,3]")).toThrow();
  });

  it("throws for non-string values", () => {
    expect(() => importFromJson(JSON.stringify({ A: 42 }))).toThrow();
  });
});

describe("importFromCsv", () => {
  it("parses key,value lines", () => {
    const map = importFromCsv("FOO,bar\nBAZ,\"hello world\"\n");
    expect(map.get("FOO")).toBe("bar");
    expect(map.get("BAZ")).toBe("hello world");
  });

  it("skips blank and comment lines", () => {
    const map = importFromCsv("# skip\n\nKEY,val\n");
    expect(map.size).toBe(1);
  });
});

describe("importFromExport", () => {
  it("strips export keyword", () => {
    const map = importFromExport("export FOO=bar\nexport BAZ='qux'\n");
    expect(map.get("FOO")).toBe("bar");
    expect(map.get("BAZ")).toBe("qux");
  });

  it("handles lines without export keyword", () => {
    const map = importFromExport("KEY=\"value\"\n");
    expect(map.get("KEY")).toBe("value");
  });
});

describe("importEnvFile", () => {
  it("reads and parses a JSON file", () => {
    const dir = makeTmpDir();
    const file = path.join(dir, "env.json");
    fs.writeFileSync(file, JSON.stringify({ X: "1" }));
    const map = importEnvFile(file);
    expect(map.get("X")).toBe("1");
    fs.rmSync(dir, { recursive: true });
  });
});
