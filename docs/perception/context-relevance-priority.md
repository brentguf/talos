# Context Relevance and Priority

Relevance describes why a file may be useful for the current review. It does not determine its priority by itself.

| Relevance               | Examples                                                       |
| :---------------------- | :------------------------------------------------------------- |
| **Direct Change**       | Modified files, diffs                                          |
| **Required Context**    | Imported UI components, a11y hooks, coupled styling            |
| **Supporting Evidence** | A11y tests, accessibility tree snapshots, a11y configuration   |
| **Deferrable**          | API clients, generic utilities, unrelated tests, backend files |

Priority determines how important a context item is for the current review. Relevance is one input to prioritization, not a fixed mapping to a priority level.

| Priority | Meaning                                                      |
| :------- | :----------------------------------------------------------- |
| **P0**   | Must have: directly relevant to the current change           |
| **P1**   | Important: needed to understand or assess the current change |
| **P2**   | Useful: provides supporting evidence or project conventions  |
| **P3**   | Deferrable: unlikely to materially affect the current review |

# Pre-processing Rules of Thumb

To avoid reading entire files just to determine their relevance, guide exploration with these lightweight heuristics:

- Likely **Required Context**: imports starting with a capital letter (likely UI components), or paths/functions containing keywords like `ui/`, `components/`, `useFocus`, `useAria`, or `useKeyboard`.
- Likely **Supporting Evidence**: test files or snapshots containing terms like `axe`, `a11y`, `tab`, `focus`, `accessibleName`, or `accessibility-tree`.
- Likely **Deferrable**: utilities (`utils/date.ts`), services, API routes, generic snapshots, and backend files.

These are heuristics, not guarantees. Classification should remain lightweight and conservative in the initial implementation.
