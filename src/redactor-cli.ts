/**
 * redactor-cli.ts — CLI integration for redacting env output before display.
 */

import { redactEnvMap, RedactOptions } from "./redactor";

export type RedactCliArgs = {
  revealChars?: number;
  mask?: string;
  sensitiveKeys?: string;
};

export function printUsage(): void {
  console.log(`
envchaim redact — Mask sensitive values in env output

Usage:
  envchain redact [options]

Options:
  --reveal-chars <n>     Number of leading characters to reveal (default: 0)
  --mask <string>        Mask string to use (default: ****)
  --sensitive-keys <rx>  Custom regex pattern for sensitive key detection
  --help                 Show this help
`.trim());
}

export function parseRedactArgs(argv: string[]): RedactCliArgs {
  const args: RedactCliArgs = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--reveal-chars" && argv[i + 1]) {
      args.revealChars = parseInt(argv[++i], 10);
    } else if (argv[i] === "--mask" && argv[i + 1]) {
      args.mask = argv[++i];
    } else if (argv[i] === "--sensitive-keys" && argv[i + 1]) {
      args.sensitiveKeys = argv[++i];
    }
  }
  return args;
}

export function runRedactCli(
  env: Map<string, string>,
  argv: string[]
): Map<string, string> {
  if (argv.includes("--help")) {
    printUsage();
    return env;
  }

  const args = parseRedactArgs(argv);
  const opts: RedactOptions = {};

  if (args.revealChars !== undefined) opts.revealChars = args.revealChars;
  if (args.mask) opts.mask = args.mask;
  if (args.sensitiveKeys) {
    try {
      opts.sensitiveKeys = new RegExp(args.sensitiveKeys, "i");
    } catch {
      console.error(`Invalid regex for --sensitive-keys: ${args.sensitiveKeys}`);
      process.exit(1);
    }
  }

  return redactEnvMap(env, opts);
}
