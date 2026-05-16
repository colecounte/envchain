import * as fs from "fs";
import * as path from "path";
import { parseEnvContent } from "./parser";
import { normalizeEnvMap, formatNormalizeSummary } from "./normalizer";
import { formatDotenv } from "./formatter";

function printUsage(): void {
  console.log(`
envchainnormalize - Normalize env keys and values

Usage:
  envchain normalize <file> [options]

Options:
  --dry-run       Show what would change without writing
  --summary       Print rename summary to stderr
  --out <file>    Write output to file instead of stdout
  --help          Show this help
`.trim());
}

export function runNormalizeCli(argv: string[]): void {
  const args = argv.slice(2);

  if (args.includes("--help") || args.length === 0) {
    printUsage();
    return;
  }

  const filePath = args[0];
  const dryRun = args.includes("--dry-run");
  const showSummary = args.includes("--summary");
  const outIdx = args.indexOf("--out");
  const outFile = outIdx !== -1 ? args[outIdx + 1] : null;

  if (!fs.existsSync(filePath)) {
    console.error(`Error: file not found: ${filePath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(filePath, "utf-8");
  const envMap = parseEnvContent(content);
  const { result, renames } = normalizeEnvMap(envMap);

  if (showSummary) {
    console.error(formatNormalizeSummary(renames));
  }

  const output = formatDotenv(result);

  if (dryRun) {
    console.log(output);
    return;
  }

  if (outFile) {
    fs.writeFileSync(path.resolve(outFile), output, "utf-8");
    console.log(`Written to ${outFile}`);
  } else {
    fs.writeFileSync(path.resolve(filePath), output, "utf-8");
    console.log(`Normalized ${filePath} (${renames.length} key(s) renamed)`);
  }
}

if (require.main === module) {
  runNormalizeCli(process.argv);
}
