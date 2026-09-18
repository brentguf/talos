import type { Relevance } from './context.js';

const A11Y_KEYWORDS = [
  'a11y',
  'accessibility',
  'accessible',
  'axe',
  'focus',
  'keyboard',
  'aria',
  'sr-only',
];

const UI_KEYWORDS = [
  '/ui/',
  '/components/',
  'usefocus',
  'usearia',
  'usekeyboard',
];

const STYLE_EXTENSIONS = ['.css', '.scss', '.sass', '.less', '.styl'];
const EVIDENCE_PATTERNS = [
  /(?:^|[./_-])(test|spec)(?:[._-]|$)/,
  /__tests__|__snapshots__|\.snap$/,
  /(?:^|\/)(eslint|vitest|jest|playwright|cypress)(?:\.|$)/,
];

export function classifyFile(path: string): Relevance {
  const lowerPath = path.toLowerCase();

  if (EVIDENCE_PATTERNS.some((pattern) => pattern.test(lowerPath))) {
    return 'supporting-evidence';
  }

  if (STYLE_EXTENSIONS.some((extension) => lowerPath.endsWith(extension))) {
    return 'required-context';
  }

  if (A11Y_KEYWORDS.some((keyword) => lowerPath.includes(keyword))) {
    return 'required-context';
  }

  if (UI_KEYWORDS.some((keyword) => lowerPath.includes(keyword))) {
    return 'required-context';
  }

  return 'deferrable';
}
