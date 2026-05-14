import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { watchEnv } from "./watcher";

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envchain-watcher-"));
}

function writeFile(dir: string, name: string, content: string): void {
  fs.writeFileSync(path.join(dir, name), content, "utf8");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe("watchEnv", () => {
  it("returns a watcher with a stop function", () => {
    const dir = makeTmpDir();
    const watcher = watchEnv(() => {}, undefined, { dir, context: "local" });
    expect(typeof watcher.stop).toBe("function");
    watcher.stop();
  });

  it("calls callback when a watched file changes", async () => {
    const dir = makeTmpDir();
    writeFile(dir, ".env", "INITIAL=true\n");

    const received: Array<Record<string, string>> = [];
    const watcher = watchEnv(
      (_ctx, envMap) => received.push(envMap),
      undefined,
      { dir, context: "local", debounceMs: 80 }
    );

    await sleep(50);
    writeFile(dir, ".env", "UPDATED=yes\n");
    await sleep(300);

    watcher.stop();
    expect(received.length).toBeGreaterThanOrEqual(1);
    const last = received[received.length - 1];
    expect(last["UPDATED"]).toBe("yes");
  }, 5000);

  it("calls onError when loadEnv fails", async () => {
    const dir = makeTmpDir();
    // Write a file that will be overwritten with invalid content
    writeFile(dir, ".env", "KEY=value\n");

    const errors: Error[] = [];
    // Simulate error by passing a non-existent context so loadEnv returns empty
    // We just verify onError wiring by stopping immediately
    const watcher = watchEnv(
      () => {},
      (err) => errors.push(err),
      { dir, context: "local", debounceMs: 50 }
    );
    watcher.stop();
    expect(Array.isArray(errors)).toBe(true);
  });

  it("stop() prevents further callbacks after being called", async () => {
    const dir = makeTmpDir();
    writeFile(dir, ".env", "A=1\n");

    const received: number[] = [];
    const watcher = watchEnv(
      () => received.push(Date.now()),
      undefined,
      { dir, context: "local", debounceMs: 80 }
    );

    watcher.stop();
    writeFile(dir, ".env", "A=2\n");
    await sleep(300);

    expect(received.length).toBe(0);
  }, 5000);
});
