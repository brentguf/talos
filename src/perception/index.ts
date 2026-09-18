import fs from 'node:fs/promises';
import path from 'node:path';

import {
  estimateTokens,
  type ContextFile,
  type PerceptionTrace,
  type Priority,
  type Relevance,
} from './context.js';
import { discoverRelatedFiles } from './discovery.js';

export interface PerceptionOptions {
  repoRoot: string;
  budget?: number;
}

function getPriority(relevance: Relevance): Priority {
  switch (relevance) {
    case 'direct-change':
      return 0;

    case 'required-context':
      return 1;

    case 'supporting-evidence':
      return 2;

    case 'deferrable':
      return 3;
  }
}

export async function perceive(
  changedFiles: string[],
  options: PerceptionOptions,
): Promise<{
  context: ContextFile[];
  trace: PerceptionTrace;
}> {
  const budget = options.budget ?? 50_000;

  const discovered: ContextFile[] = [];

  for (const relativePath of changedFiles) {
    const absolutePath = path.join(options.repoRoot, relativePath);

    try {
      const content = await fs.readFile(absolutePath, 'utf8');

      // Changed files are always the most relevant context.
      // Related-file discovery can classify additional files later.
      const relevance: Relevance = 'direct-change';

      discovered.push({
        path: relativePath,
        content,
        relevance,
        priority: getPriority(relevance),
        tokens: estimateTokens(content),
      });
    } catch {
      // The file may have been deleted by the current change.
    }
  }

  const relatedFiles = await discoverRelatedFiles(changedFiles, options.repoRoot);

  for (const candidate of relatedFiles) {
    const absolutePath = path.join(options.repoRoot, candidate.path);

    try {
      const content = await fs.readFile(absolutePath, 'utf8');
      const relevance = candidate.relevance;

      discovered.push({
        path: candidate.path,
        content,
        relevance,
        priority: getPriority(relevance),
        tokens: estimateTokens(content),
      });
    } catch {
      // A related file may be deleted or become inaccessible during discovery.
    }
  }

  // Lower priority number = higher relevance.
  discovered.sort((a, b) => a.priority - b.priority);

  const selected: ContextFile[] = [];
  const droppedFiles: string[] = [];

  let tokensSelected = 0;

  for (const file of discovered) {
    if (tokensSelected + file.tokens <= budget) {
      selected.push(file);
      tokensSelected += file.tokens;
    } else {
      droppedFiles.push(file.path);
    }
  }

  const tokensConsidered = discovered.reduce(
    (total, file) => total + file.tokens,
    0,
  );

  const trace: PerceptionTrace = {
    filesDiscovered: discovered.length,
    filesSelected: selected.length,
    filesDropped: droppedFiles.length,
    tokensConsidered,
    tokensSelected,
    droppedFiles,
  };

  return {
    context: selected,
    trace,
  };
}
