import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { perceive } from './index.js';
import { reviewDiff } from '../review.js';

const fixtureRoot = resolve(process.cwd(), 'fixtures/perception');
const changedFile = 'src/components/SaveButton.tsx';

test('perception discovers and prioritizes related accessibility context', async () => {
  const { context, trace } = await perceive([changedFile], {
    repoRoot: fixtureRoot,
  });

  const files = new Map(context.map((file) => [file.path, file]));

  assert.equal(files.get(changedFile)?.priority, 0);
  assert.equal(files.get('src/a11y/useFocusTrap.ts')?.priority, 1);
  assert.equal(files.get('src/components/SaveButton.css')?.priority, 1);
  assert.equal(files.get('src/components/SaveButton.test.tsx')?.priority, 2);
  assert.equal(files.get('src/utils/formatDate.ts')?.priority, 3);
  assert.equal(trace.filesDiscovered, 5);
  assert.equal(trace.filesDropped, 0);
  assert.deepEqual(
    context.map((file) => file.priority),
    [...context].map((file) => file.priority).sort((a, b) => a - b),
  );
});

test('perception retains P0 context first when the budget is constrained', async () => {
  const full = await perceive([changedFile], { repoRoot: fixtureRoot });
  const changedTokens = full.context.find((file) => file.path === changedFile)?.tokens;

  assert.ok(changedTokens);

  const { context, trace } = await perceive([changedFile], {
    repoRoot: fixtureRoot,
    budget: changedTokens,
  });

  assert.deepEqual(context.map((file) => file.path), [changedFile]);
  assert.equal(trace.filesDropped, 4);
});

test('perception tolerates files deleted by the current change', async () => {
  const { context, trace } = await perceive(['src/deleted.ts'], {
    repoRoot: fixtureRoot,
  });

  assert.equal(context.some((file) => file.path === 'src/deleted.ts'), false);
  assert.equal(trace.filesDiscovered, context.length);
});

test('a unified diff flows through perception into the reviewer context', async () => {
  const diffPath = resolve(process.cwd(), 'fixtures/perception-change.diff');
  const diff = await readFile(diffPath, 'utf8');
  let receivedContext = '';

  const result = await reviewDiff(diff, {
    repoRoot: fixtureRoot,
    analyze: async (context) => {
      receivedContext = context;
      return { summary: 'Reviewed fixture', findings: [] };
    },
  });

  assert.equal(result.report.summary, 'Reviewed fixture');
  assert.equal(result.trace.filesSelected > 0, true);
  assert.match(receivedContext, /## src\/components\/SaveButton\.tsx/);
  assert.match(receivedContext, /## src\/a11y\/useFocusTrap\.ts/);
});
