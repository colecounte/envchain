import { cascadeEnv, formatCascadeResult } from './cascader';
import { formatEnvMap } from './formatter';

function printUsage(): void {
  console.log(`
Usage: envchain cascade [options]

Options:
  --context <ctx>   Context to cascade (local, staging, ci, production)
  --dir <path>      Base directory to search for .env files (default: cwd)
  --format <fmt>    Output format: dotenv | export | json | csv (default: dotenv)
  --strict          Fail if no env files are found
  --info            Print cascade source info instead of env output
  --help            Show this help
`.trim());
}

interface CascadeCliArgs {
  context: string;
  dir: string;
  format: string;
  strict: boolean;
  info: boolean;
}

export function parseCascadeArgs(argv: string[]): CascadeCliArgs {
  const args: CascadeCliArgs = {
    context: process.env.NODE_ENV ?? 'local',
    dir: process.cwd(),
    format: 'dotenv',
    strict: false,
    info: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--help') { printUsage(); process.exit(0); }
    else if (arg === '--strict') args.strict = true;
    else if (arg === '--info') args.info = true;
    else if (arg === '--context' && argv[i + 1]) args.context = argv[++i];
    else if (arg === '--dir' && argv[i + 1]) args.dir = argv[++i];
    else if (arg === '--format' && argv[i + 1]) args.format = argv[++i];
  }

  return args;
}

export async function runCascadeCli(argv: string[]): Promise<void> {
  const args = parseCascadeArgs(argv);

  try {
    const result = await cascadeEnv({
      context: args.context,
      baseDir: args.dir,
      strict: args.strict,
    });

    if (args.info) {
      console.log(formatCascadeResult(result));
    } else {
      console.log(formatEnvMap(result.merged, args.format as any));
    }
  } catch (err: any) {
    console.error(`cascade error: ${err.message}`);
    process.exit(1);
  }
}

if (import.meta.main) {
  runCascadeCli(process.argv.slice(2));
}
