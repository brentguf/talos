export type Priority = 0 | 1 | 2 | 3;

export type Relevance =
  | 'direct-change'
  | 'required-context'
  | 'supporting-evidence'
  | 'deferrable';

export interface ContextFile {
  path: string;
  content: string;
  relevance: Relevance;
  priority: Priority;
  tokens: number;
}

export interface PerceptionTrace {
  filesDiscovered: number;
  filesSelected: number;
  filesDropped: number;
  tokensConsidered: number;
  tokensSelected: number;
  droppedFiles: string[];
}

export function estimateTokens(content: string): number {
  return Math.ceil(content.length / 4);
}
