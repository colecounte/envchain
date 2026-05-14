import { resolveEnv } from './resolver';
import { exportEnvMap, inferFormat, ExportFormat } from './exporter';

function printUsage(): void {
  console.log(`
Usage: envchain export [options]

Options:
  --context <ctx>     Context to load (default: local)
  --format <fmt>      Output format: dotenv | export | json | csv
  --output <path>     Write output to file instead of stdout
  --overwrite         Overwrite existing output file
  --help              Show this help message
`.trim());
}

export async function runExporterCli(argv: string[]): Promise<void> {
  const args = argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    printUsage();
    return;
  }

  const contextIdx = args.indexOf('--context');
  const context = contextIdx !== -1 ? args[contextIdx + 1] : 'local';

  const outputIdx = args.indexOf('--output');
  const outputPath = outputIdx !== -1 ? args[outputIdx + 1] : undefined;

  const formatIdx = args.indexOf('--format');
  let format: ExportFormat;
  if (formatIdx !== -1) {
    format = args[formatIdx + 1] as ExportFormat;
  } else if (outputPath) {
    format = inferFormat(outputPath);
  } else {
    format = 'dotenv';
  }

  const overwrite = args.includes('--overwrite');

  const validFormats: ExportFormat[] = ['dotenv', 'export', 'json', 'csv'];
  if (!validFormats.includes(format)) {
    console.error(`Unknown format: ${format}. Valid formats: ${validFormats.join(', ')}`);
    process.exit(1);
  }

  try {
    const envMap = await resolveEnv(process.cwd(), context);
    const content = exportEnvMap(envMap, { format, outputPath, overwrite });

    if (!outputPath) {
      process.stdout.write(content);
    } else {
      console.error(`Exported to ${outputPath} (format: ${format})`);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Export failed: ${message}`);
    process.exit(1);
  }
}
