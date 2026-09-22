import { analyzeAccessibility, type AccessibilityReport } from './analysis.js';
import { perceive } from './perception/index.js';
import type { ContextFile, PerceptionTrace } from './perception/context.js';

export interface ReviewOptions {
  repoRoot: string;
  budget?: number;
  /** Allows callers and tests to provide a compatible reviewer implementation. */
  analyze?: (context: string) => Promise<AccessibilityReport>;
}

export interface ReviewResult {
  report: AccessibilityReport;
  trace: PerceptionTrace;
}

export async function reviewDiff(
  diff: string,
  options: ReviewOptions,
): Promise<ReviewResult> {
  const changedFiles = extractChangedFiles(diff);

  const { context, trace } = await perceive(changedFiles, {
    repoRoot: options.repoRoot,
    budget: options.budget,
  });

  const reviewContext = formatContext(context);

  const report = await (options.analyze ?? analyzeAccessibility)(reviewContext);

  return {
    report,
    trace,
  };
}

function extractChangedFiles(diff: string): string[] {
  const files = new Set<string>();

  for (const line of diff.split('\n')) {
    if (!line.startsWith('+++ ')) {
      continue;
    }

    const file = line.slice(4);

    if (file === '/dev/null') {
      continue;
    }

    if (file.startsWith('b/')) {
      files.add(file.slice(2));
    }
  }

  return [...files];
}

function formatContext(context: ContextFile[]): string {
  return context
    .map((file) => `## ${file.path}\n\n\`\`\`\n${file.content}\n\`\`\``)
    .join('\n\n');
}
