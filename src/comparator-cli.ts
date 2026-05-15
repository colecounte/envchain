import * as fs from 'fs';
import * as path from 'path';
import { parseEnvContent } from './parser';
import { compareEnvMaps, formatCompareResult, summarizeCompare } from './comparator';

function printUsage() {
  console.log(`Usage: envchain compare <base-file> <target-file> [options]

Options:
  --verbose, -v    Include unchanged keys in output
  --summary, -s    Print only a summary line
  --help, -h       Show this help message
`);
}

export function parseCompareArgs(argv: string[]) {
  const args = argv.slice(2);
  let baseFile: string | undefined;
  let targetFile: string | undefined;
  let verbose = false;
  let summary = false;

  for (const arg of args) {
    if (arg === '--help' || arg === '-h') return { help: true };
    if (arg === '--verbose' || arg === '-v') { verbose = true; continue; }
    if (arg === '--summary' || arg === '-s') { summary = true; continue; }
    if (!baseFile) { baseFile = arg; continue; }
    if (!targetFile) { targetFile = arg; continue; }
  }

  return { baseFile, targetFile, verbose, summary, help: false };
}

export async function runCompareCli(argv: string[]): Promise<void> {
  const opts = parseCompareArgs(argv);

  if (opts.help || !opts.baseFile || !opts.targetFile) {
    printUsage();
    process.exit(opts.help ? 0 : 1);
  }

  const readMap = (filePath: string) => {
    const content = fs.readFileSync(path.resolve(filePath), 'utf-8');
    return parseEnvContent(content);
  };

  const base = readMap(opts.baseFile);
  const target = readMap(opts.targetFile);
  const result = compareEnvMaps(base, target);

  if (opts.summary) {
    console.log(summarizeCompare(result));
  } else {
    const output = formatCompareResult(result, opts.verbose);
    if (output) console.log(output);
    else console.log('No differences found.');
  }
}
