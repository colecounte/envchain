#!/usr/bin/env node
/**
 * Entry point for the envchain CLI binary.
 * Delegates to main() in cli.ts so that the core logic remains testable.
 */
import { main } from './cli';

main(process.argv).catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
