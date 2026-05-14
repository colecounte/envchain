import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { runProfileCli } from "./profile-cli";
import { loadProfiles } from "./profile";

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envchain-pcli-"));
}

describe("profile-cli", () => {
  let tmpDir: string;
  let logs: string[];
  let errors: string[];

  beforeEach(() => {
    tmpDir = makeTmpDir();
    logs = [];
    errors = [];
    jest.spyOn(console, "log").mockImplementation((...args) => logs.push(args.join(" ")));
    jest.spyOn(console, "error").mockImplementation((...args) => errors.push(args.join(" ")));
  });

  afterEach(() => {
    jest.restoreAllMocks();
    fs.rmSync(tmpDir, { recursive: true });
  });

  test("list with no profiles prints empty message", () => {
    runProfileCli(["list"], tmpDir);
    expect(logs[0]).toMatch(/No profiles/);
  });

  test("add creates a profile", () => {
    runProfileCli(["add", "myapp", "--contexts", "local,staging", "--desc", "My app"], tmpDir);
    const profiles = loadProfiles(tmpDir);
    expect(profiles["myapp"]).toBeDefined();
    expect(profiles["myapp"].contexts).toEqual(["local", "staging"]);
    expect(profiles["myapp"].description).toBe("My app");
    expect(logs[0]).toMatch(/saved/);
  });

  test("list shows added profiles", () => {
    runProfileCli(["add", "myapp", "--contexts", "local"], tmpDir);
    logs = [];
    runProfileCli(["list"], tmpDir);
    expect(logs[0]).toContain("myapp");
    expect(logs[0]).toContain("local");
  });

  test("get prints profile as JSON", () => {
    runProfileCli(["add", "myapp", "--contexts", "ci"], tmpDir);
    logs = [];
    runProfileCli(["get", "myapp"], tmpDir);
    const parsed = JSON.parse(logs.join(""));
    expect(parsed.name).toBe("myapp");
  });

  test("remove deletes a profile", () => {
    runProfileCli(["add", "myapp", "--contexts", "local"], tmpDir);
    runProfileCli(["remove", "myapp"], tmpDir);
    expect(loadProfiles(tmpDir)).toEqual({});
    expect(logs.some((l) => l.includes("removed"))).toBe(true);
  });

  test("add without --contexts logs error", () => {
    const exitSpy = jest.spyOn(process, "exit").mockImplementation(() => { throw new Error("exit"); });
    expect(() => runProfileCli(["add", "myapp"], tmpDir)).toThrow("exit");
    expect(errors[0]).toMatch(/--contexts required/);
    exitSpy.mockRestore();
  });

  test("unknown command logs error", () => {
    const exitSpy = jest.spyOn(process, "exit").mockImplementation(() => { throw new Error("exit"); });
    expect(() => runProfileCli(["unknown"], tmpDir)).toThrow("exit");
    expect(errors[0]).toMatch(/Unknown command/);
    exitSpy.mockRestore();
  });
});
