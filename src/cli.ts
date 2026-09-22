import { readFileSync } from 'fs';
import { resolve } from 'path';
import { reviewDiff } from './review.js';

interface CliOptions {
  diffFile: string;
  budget: number;
  verbose: boolean;
}

function printUsage(): never {
  console.error('Usage: talos <diff-file> [--budget <tokens>] [--verbose]');
  process.exit(1);
}

function parseArgs(args: string[]): CliOptions {
  if (args.length === 0) {
    printUsage();
  }

  const diffFile = args[0];

  if (!diffFile || diffFile.startsWith('-')) {
    printUsage();
  }

  let budget = 50_000;
  let verbose = false;

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--budget') {
      const value = args[++i];

      if (!value) {
        console.error('Error: --budget requires a value');
        process.exit(1);
      }

      budget = Number(value);

      if (!Number.isInteger(budget) || budget <= 0) {
        console.error('Error: --budget must be a positive integer');
        process.exit(1);
      }
    } else if (arg === '--verbose' || arg === '-v') {
      verbose = true;
    } else {
      console.error(`Error: unknown option "${arg}"`);
      printUsage();
    }
  }

  return {
    diffFile: resolve(diffFile),
    budget,
    verbose,
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  let diff: string;

  try {
    diff = readFileSync(options.diffFile, 'utf-8');
  } catch (error) {
    console.error(
      `Error: could not read diff file "${options.diffFile}": ${
        error instanceof Error ? error.message : error
      }`,
    );
    process.exit(1);
  }

  try {
    const result = await reviewDiff(diff, {
      repoRoot: process.cwd(),
      budget: options.budget,
    });

    if (options.verbose) {
      console.error(`Diff: ${options.diffFile}`);
      console.error(`Budget: ${options.budget} tokens\n`);

      console.error('=== Perception ===');
      console.error(JSON.stringify(result.trace, null, 2));
      console.error('');
    }

    console.log(JSON.stringify(result.report, null, 2));
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
