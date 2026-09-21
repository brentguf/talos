# Talos

Talos is a command-line accessibility (a11y) reviewer for code changes. It reads a unified Git diff, gathers the most relevant repository context, and asks an LLM to identify potential [WCAG 2.2](https://www.w3.org/TR/WCAG22/) issues in the changed code.

## How it works

1. Talos extracts the changed paths from a unified diff.
2. Its perception layer loads the changed files and discovers related local context, such as imported UI components, accessibility helpers, coupled styles, and relevant tests.
3. Context is classified and prioritized from P0 (the change itself) through P3 (deferrable context), then constrained by a token budget.
4. The selected context is sent to an accessibility reviewer, which returns a structured JSON report.

## Requirements

- Node.js 22 or later
- An `OPENROUTER_API_KEY` environment variable

## Installation

```sh
npm install
npm run build
```

## Usage

First, generate a unified diff. For example:

```sh
git diff > change.diff
```

Then run Talos against it:

```sh
OPENROUTER_API_KEY=your_key npm start -- change.diff
```

By default, Talos uses a 50,000-token context budget. Override it with `--budget` and display the perception trace with `--verbose`:

```sh
OPENROUTER_API_KEY=your_key npm start -- change.diff --budget 12000 --verbose
```

The report is printed as JSON:

```json
{
  "summary": "A brief assessment of the change.",
  "findings": [
    {
      "line": 42,
      "wcagCriterion": "1.1.1 Non-text Content",
      "level": "A",
      "message": "Describe the accessibility issue and a useful correction."
    }
  ]
}
```

`line` is omitted when Talos cannot associate a finding with a particular line.

## Development

```sh
npm test
```

The test suite builds the TypeScript source, runs the perception tests, and runs the fixture project's tests. Use watch mode during development:

```sh
npm run dev
```

## Project structure

- `src/index.ts` — CLI entry point.
- `src/review.ts` — diff-to-review orchestration.
- `src/core.ts` — OpenRouter-backed accessibility reviewer.
- `src/perception/` — context discovery, classification, prioritization, and token-budget selection.
- `fixtures/perception/` — small project used to validate perception behavior.
- `docs/perception/` — perception model and implementation notes.

## Current limitations

The initial perception implementation resolves only relative imports and uses filesystem heuristics to find relevant accessibility context. It does not yet resolve package imports or TypeScript path aliases.

## License

MIT
