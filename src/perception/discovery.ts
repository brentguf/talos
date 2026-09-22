import fs from 'node:fs/promises';
import path from 'node:path';

import { classifyFile } from './relevance.js';
import type { Relevance } from './context.js';

const RESOLVABLE_EXTENSIONS = [
  '',
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.css',
  '.scss',
  '.sass',
  '.less',
];

const IGNORED_DIRECTORIES = new Set([
  '.git',
  'node_modules',
  'dist',
  'build',
  'coverage',
]);

const A11Y_EVIDENCE =
  /\b(axe|a11y|accessibility|focus|tab|accessibleName|accessibility-tree)\b/i;
const TEST_OR_CONFIG =
  /(?:\.(test|spec)\.[^.]+$|\.snap$|__tests__|__snapshots__|(?:^|\/)(?:eslint|vitest|jest|playwright|cypress)(?:\.|$))/i;
const CONFIG_FILE =
  /(?:^|\/)(?:eslint|vitest|jest|playwright|cypress)(?:\.config)?\.[^.]+$/i;

export interface DiscoveredCandidate {
  path: string;
  relevance: Relevance;
}

/**
 * Finds the lightweight, file-system level context used by perception v1.
 * It deliberately follows only relative imports; package and alias resolution
 * belongs to a future dependency-aware implementation.
 */
export async function discoverRelatedFiles(
  changedFiles: string[],
  repoRoot: string,
): Promise<DiscoveredCandidate[]> {
  const candidates = new Map<string, Relevance>();

  for (const changedPath of changedFiles) {
    const absolutePath = path.join(repoRoot, changedPath);
    let content: string;

    try {
      content = await fs.readFile(absolutePath, 'utf8');
    } catch {
      continue;
    }

    for (const specifier of extractRelativeImports(content)) {
      const resolved = await resolveRelativeImport(
        path.dirname(absolutePath),
        specifier,
        repoRoot,
      );

      if (resolved) {
        candidates.set(resolved, classifyFile(resolved));
      }
    }
  }

  for (const evidencePath of await findA11yEvidence(repoRoot, changedFiles)) {
    candidates.set(evidencePath, 'supporting-evidence');
  }

  for (const changedPath of changedFiles) {
    candidates.delete(normalizePath(changedPath));
  }

  return [...candidates.entries()].map(([candidatePath, relevance]) => ({
    path: candidatePath,
    relevance,
  }));
}

function extractRelativeImports(content: string): string[] {
  const imports = new Set<string>();
  const pattern =
    /(?:\b(?:import|export)\s+(?:type\s+)?[^\n;]*?\s+from\s*["']([^"']+)["']|\bimport\s*["']([^"']+)["']|\bimport\s*\(\s*["']([^"']+)["']\s*\)|\brequire\s*\(\s*["']([^"']+)["']\s*\))/g;

  for (const match of content.matchAll(pattern)) {
    const specifier = match[1] ?? match[2] ?? match[3] ?? match[4];
    if (specifier?.startsWith('.')) {
      imports.add(specifier);
    }
  }

  return [...imports];
}

async function resolveRelativeImport(
  fromDirectory: string,
  specifier: string,
  repoRoot: string,
): Promise<string | undefined> {
  const basePath = path.resolve(fromDirectory, specifier);

  if (!isInsideRepo(basePath, repoRoot)) {
    return undefined;
  }

  for (const extension of RESOLVABLE_EXTENSIONS) {
    const candidate = `${basePath}${extension}`;
    if (await isFile(candidate)) {
      return normalizePath(path.relative(repoRoot, candidate));
    }
  }

  for (const extension of RESOLVABLE_EXTENSIONS.slice(1)) {
    const candidate = path.join(basePath, `index${extension}`);
    if (await isFile(candidate)) {
      return normalizePath(path.relative(repoRoot, candidate));
    }
  }

  return undefined;
}

async function findA11yEvidence(
  repoRoot: string,
  changedFiles: string[],
): Promise<string[]> {
  const files: string[] = [];
  await walk(repoRoot, repoRoot, files);
  const changedNames = changedFiles.map((changedPath) =>
    path
      .basename(changedPath)
      .replace(/\.[^.]+$/, '')
      .toLowerCase(),
  );

  const matches: string[] = [];
  for (const relativePath of files) {
    if (!TEST_OR_CONFIG.test(relativePath)) {
      continue;
    }

    try {
      const content = await fs.readFile(
        path.join(repoRoot, relativePath),
        'utf8',
      );
      const lowerPath = relativePath.toLowerCase();
      const lowerContent = content.toLowerCase();
      const isRelated = changedNames.some(
        (name) => lowerPath.includes(name) || lowerContent.includes(name),
      );

      if (
        A11Y_EVIDENCE.test(content) &&
        (CONFIG_FILE.test(relativePath) || isRelated)
      ) {
        matches.push(relativePath);
      }
    } catch {
      // Ignore files that disappear while discovery is running.
    }
  }

  return matches;
}

async function walk(
  repoRoot: string,
  directory: string,
  files: string[],
): Promise<void> {
  const entries = await fs.readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (!IGNORED_DIRECTORIES.has(entry.name)) {
        await walk(repoRoot, path.join(directory, entry.name), files);
      }
    } else if (entry.isFile()) {
      files.push(
        normalizePath(
          path.relative(repoRoot, path.join(directory, entry.name)),
        ),
      );
    }
  }
}

async function isFile(candidate: string): Promise<boolean> {
  try {
    return (await fs.stat(candidate)).isFile();
  } catch {
    return false;
  }
}

function isInsideRepo(candidate: string, repoRoot: string): boolean {
  const relative = path.relative(repoRoot, candidate);
  return (
    relative !== '' &&
    !relative.startsWith(`..${path.sep}`) &&
    relative !== '..'
  );
}

function normalizePath(filePath: string): string {
  return filePath.split(path.sep).join('/');
}
