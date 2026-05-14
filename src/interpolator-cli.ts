/**
 * CLI sub-command: envchain interpolate
 * Reads a template file and renders it using the resolved env.
 */

import fs from 'fs';
import path from 'path';
import { resolveEnv } from './resolver';
import { renderTemplate } from './template';

export interface InterpolateCLIOptions {
  templateFile: string;
  context?: string;
  dir?: string;
  strict?: boolean;
  output?: string;
}

export async function runInterpolateCLI(opts: InterpolateCLIOptions): Promise<void> {
  const { templateFile, context, dir = process.cwd(), strict = false, output } = opts;

  const templatePath = path.resolve(dir, templateFile);
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template file not found: ${templatePath}`);
  }

  const template = fs.readFileSync(templatePath, 'utf8');
  const env = await resolveEnv({ context, dir });
  const rendered = renderTemplate(template, env, { strict });

  if (output) {
    const outPath = path.resolve(dir, output);
    fs.writeFileSync(outPath, rendered, 'utf8');
    process.stderr.write(`Written to ${outPath}\n`);
  } else {
    process.stdout.write(rendered);
  }
}

// Allow direct invocation: node interpolator-cli.js <template> [--context=<ctx>] [--strict] [--output=<file>]
if (require.main === module) {
  const args = process.argv.slice(2);
  const templateFile = args.find((a) => !a.startsWith('--')) ?? '';
  const context = args.find((a) => a.startsWith('--context='))?.split('=')[1];
  const strict = args.includes('--strict');
  const output = args.find((a) => a.startsWith('--output='))?.split('=')[1];

  if (!templateFile) {
    process.stderr.write('Usage: interpolator-cli <template-file> [--context=<ctx>] [--strict] [--output=<file>]\n');
    process.exit(1);
  }

  runInterpolateCLI({ templateFile, context, strict, output }).catch((err) => {
    process.stderr.write(`Error: ${(err as Error).message}\n`);
    process.exit(1);
  });
}
