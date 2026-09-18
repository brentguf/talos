# Perception Layer — TODO

## 1. Context model

- [x] Define `ContextFile`
- [x] Define `Relevance`
- [x] Define P0–P3 `Priority`
- [x] Add token estimation
- [x] Add perception trace

## 2. Initial perception

- [x] Receive changed files
- [x] Read changed files from the repository
- [x] Mark changed files as `direct-change` / P0
- [x] Sort context by priority
- [x] Enforce token budget
- [x] Track dropped files

## 3. Related-file discovery

- [x] Discover direct relative imports from changed files
- [x] Identify likely UI components
- [x] Identify a11y hooks/helpers
- [x] Identify directly coupled styling
- [x] Identify relevant a11y tests/snapshots/config
- [x] Keep discovery heuristic-based for v1
- [ ] Do not implement semantic/AST dependency analysis yet

## 4. Classification & prioritization

- [x] Define relevance categories
- [x] Separate relevance from priority conceptually
- [x] Implement heuristic file classification
- [x] Apply classification to discovered files
- [x] Assign priority to discovered candidates
- [x] Include discovered P1/P2/P3 files in context selection
- [ ] Keep explicitly changed files at P0 regardless of classification

## 5. Review integration

- [x] Extract changed files from unified diff
- [x] Add `reviewDiff()` orchestration
- [x] Pass repository root to perception
- [x] Gather selected review context
- [x] Gather and expose perception trace
- [x] Add basic context formatting
- [x] Pass selected context to accessibility reviewer

## 6. CLI

- [x] Accept unified diff as input
- [x] Add `--budget` option
- [x] Add `--verbose` perception trace output
- [x] Add diff fixture for local testing

## 7. Validation

- [x] Create a small fixture repository
- [x] Test P0 detection
- [x] Test P1 heuristics
- [x] Test P2 heuristics
- [x] Test P3 heuristics
- [x] Test priority ordering
- [x] Test token-budget truncation/selection
- [x] Test deleted files
- [x] Inspect perception trace
- [x] Test end-to-end diff → perception → review flow

## Explicitly out of scope for perception v1

- [ ] Semantic/AST-based dependency analysis
- [ ] Full dependency graph
- [ ] Lost-in-the-middle optimization
- [ ] Dynamic/contextual priority scoring
- [ ] Sophisticated tokenization
- [ ] Vision-based perception
