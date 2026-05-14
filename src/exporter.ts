import { formatEnvMap } from './formatter';
import { EnvMap } from './merger';
import * as fs from 'fs';
import * as path from 'path';

export type ExportFormat = 'dotenv' | 'export' | 'json' | 'csv';

export interface ExportOptions {
  format: ExportFormat;
  outputPath?: string;
  overwrite?: boolean;
}

export function exportEnvMap(
  envMap: EnvMap,
  options: ExportOptions
): string {
  const content = formatEnvMap(envMap, options.format);

  if (options.outputPath) {
    const resolved = path.resolve(options.outputPath);
    if (fs.existsSync(resolved) && !options.overwrite) {
      throw new Error(
        `Output file already exists: ${resolved}. Use --overwrite to replace it.`
      );
    }
    const dir = path.dirname(resolved);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(resolved, content, 'utf8');
  }

  return content;
}

export function inferFormat(filePath: string): ExportFormat {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.json':
      return 'json';
    case '.csv':
      return 'csv';
    case '.sh':
      return 'export';
    default:
      return 'dotenv';
  }
}
