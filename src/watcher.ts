import * as fs from "fs";
import * as path from "path";
import { envFileCandidates } from "./resolver";
import { loadEnv } from "./loader";

export type WatchCallback = (context: string, envMap: Record<string, string>) => void;
export type WatchErrorCallback = (err: Error) => void;

export interface WatchOptions {
  context?: string;
  dir?: string;
  debounceMs?: number;
}

export interface Watcher {
  stop: () => void;
}

export function watchEnv(
  callback: WatchCallback,
  onError?: WatchErrorCallback,
  options: WatchOptions = {}
): Watcher {
  const dir = options.dir ?? process.cwd();
  const context = options.context ?? "local";
  const debounceMs = options.debounceMs ?? 300;

  const candidates = envFileCandidates(context, dir);
  const watchers: fs.FSWatcher[] = [];
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  const handleChange = (filename: string) => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      try {
        const envMap = await loadEnv(context, dir);
        callback(context, envMap);
      } catch (err) {
        if (onError) onError(err instanceof Error ? err : new Error(String(err)));
      }
    }, debounceMs);
  };

  for (const candidate of candidates) {
    const filePath = path.resolve(dir, candidate);
    const fileDir = path.dirname(filePath);
    try {
      const watcher = fs.watch(fileDir, { persistent: false }, (event, name) => {
        if (name && filePath.endsWith(name)) {
          handleChange(filePath);
        }
      });
      watchers.push(watcher);
    } catch {
      // directory may not exist; skip silently
    }
  }

  return {
    stop: () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      for (const w of watchers) w.close();
    },
  };
}
