/**
 * scoper-cli.ts — CLI interface for the scoper module
 *
 * Usage:
 *   envchain scope <scope> [--apply | --extract] [--file <path>]
 */

import { readFileSync } from 'fs';
import { parseEnvContent } from './parser';
import { scopeEnvMap, applyScope, detectScopes } from './scoper';
import { formatDotenv } from './formatter';

export function printUsage(): void {
  console.log(`
Usage: envchain scope <command> [options]

Commands:
  extract <SCOPE>   Extract keys belonging to SCOPE (strips prefix)
  apply   <SCOPE>   Add SCOPE prefix to all keys
  detect            List all scope prefixes found in the env file

Options:
  --file <path>     Path to .env file (default: .env)
  --help            Show this help message
`.trim());
}

export interface ScopeArgs {
  command: 'extract' | 'apply' | 'detect';
  scope?: string;
  file: string;
}

export function parseScopeArgs(argv: string[]): ScopeArgs | null {
  const args = argv.slice(0);
  if (args.includes('--help') || args.length === 0) return null;

  const file = (() => {
    const idx = args.indexOf('--file');
    return idx !== -1 ? args[idx + 1] : '.env';
  })();

  const command = args[0] as ScopeArgs['command'];
  const scope = args[1];

  if (!['extract', 'apply', 'detect'].includes(command)) return null;
  if ((command === 'extract' || command === 'apply') && !scope) return null;

  return { command, scope, file };
}

export function runScopeCli(argv: string[]): void {
  const args = parseScopeArgs(argv);
  if (!args) {
    printUsage();
    process.exit(1);
  }

  let raw: string;
  try {
    raw = readFileSync(args.file, 'utf-8');
  } catch {
    console.error(`Error: could not read file '${args.file}'`);
    process.exit(1);
  }

  const env = parseEnvContent(raw);

  if (args.command === 'detect') {
    const scopes = detectScopes(env);
    if (scopes.length === 0) {
      console.log('No scopes detected.');
    } else {
      console.log(scopes.join('\n'));
    }
    return;
  }

  if (args.command === 'extract') {
    const { scoped } = scopeEnvMap(env, args.scope!);
    console.log(formatDotenv(scoped));
    return;
  }

  if (args.command === 'apply') {
    const result = applyScope(env, args.scope!);
    console.log(formatDotenv(result));
  }
}
