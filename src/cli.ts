#!/usr/bin/env node
import { resolveEnvToProcess } from './resolver';

const USAGE = `
Usage: envchain [options] [context...]

Options:
  --cwd <dir>      Working directory (default: process.cwd())
  --print          Print resolved env vars instead of injecting into process
  --help           Show this help message

Contexts (applied in order, later overrides earlier):
  local, staging, ci, production, etc.

Examples:
  envchain local staging
  envchain --print local
  envchain --cwd /path/to/project ci
`.trim();

function parseArgs(argv: string[]): {
  cwd: string;
  print: boolean;
  contexts: string[];
  help: boolean;
} {
  const args = argv.slice(2);
  const result = {
    cwd: process.cwd(),
    print: false,
    contexts: [] as string[],
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--help' || arg === '-h') {
      result.help = true;
    } else if (arg === '--print') {
      result.print = true;
    } else if (arg === '--cwd') {
      const next = args[++i];
      if (!next) {
        console.error('Error: --cwd requires a directory argument');
        process.exit(1);
      }
      result.cwd = next;
    } else if (!arg.startsWith('--')) {
      result.contexts.push(arg);
    } else {
      console.error(`Error: Unknown option "${arg}"`);
      process.exit(1);
    }
  }

  return result;
}

export async function main(argv: string[] = process.argv): Promise<void> {
  const opts = parseArgs(argv);

  if (opts.help) {
    console.log(USAGE);
    return;
  }

  const contexts = opts.contexts.length > 0 ? opts.contexts : ['local'];

  try {
    const resolved = await resolveEnvToProcess(opts.cwd, contexts);

    if (opts.print) {
      for (const [key, value] of Object.entries(resolved)) {
        console.log(`${key}=${value}`);
      }
    } else {
      Object.assign(process.env, resolved);
    }
  } catch (err) {
    console.error('Error resolving env:', (err as Error).message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
