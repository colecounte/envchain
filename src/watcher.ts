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

/**
 * Watches all env file candidates for the given context and directory.
 * Triggers the callback with the merged env map whenever a relevant file changes.
 *
 * @param callback - Called with the context name and updated env map on change.
 * @param onError - Optional handler for errors during file watching or env loading.
 * @param options - Optional configuration: context, dir, and debounce delay.
 * @returns A Watcher handle with a `stop()` method to clean up watchers.
 */
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

  // Track directories already being watched to avoid duplicate watchers
  const watchedDirs = new Set<string>();

  for (const candidate of candidates) {
    const filePath = path.resolve(dir, candidate);
    const fileDir = path.dirname(filePath);

    if (watchedDirs.has(fileDir)) continue;
    watchedDirs.add(fileDir);

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
