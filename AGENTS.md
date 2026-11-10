<!-- bmad:context -->
<!-- Verified 2026-10-22 against e026e8a. Managed by bmad-project-context; edits inside this block are replaced on refresh. Keep anything you want preserved outside the markers. -->

## file-browser

Client-side file browser: Vite, React, TypeScript. Read-only access to the user's files, with previews. Domain and props types live in `src/types.ts`.

## Policy

- Never add a backend or make network requests to external services; everything runs client-side.
- Never write, rename or delete the user's files; file access stays read-only.
- Never install an icon library (lucide, fontawesome, react-icons) — use inline SVGs.
- Never edit files outside the stated scope of the task.
- Never commit with failing types or lint — `npm run build` and `npm run lint` must pass first.
- After editing, run `git status` to confirm only the intended files changed.
- Never break file-tree accessibility: keep the `role="tree"` container, `FileRow`'s `role="treeitem"` and `aria-selected`, and `role="group"` around each expanded folder's children. Folders keep `aria-expanded`; items keep `aria-level`, `aria-setsize` and `aria-posinset` where the hierarchy needs them.
- Keep roving tabindex: exactly one treeitem has `tabIndex={0}` (the focused or selected one), all others `-1`, so the tree is a single Tab stop. Arrow Up/Down move between visible items, Right expands a folder or moves to its first child, Left collapses it or moves to its parent, Home/End jump to the first/last visible item, and Enter/Space select. Previews must stay keyboard-reachable.

## Where things are

- Pure helpers: `src/lib/`. Browser and file-system access (impure): `src/services/`. Components: `src/components/`.

## Running and verifying

- Type-check with `npm run build` (`tsc -b`) or `npx tsc -p tsconfig.app.json --noEmit`.

## Conventions that differ from defaults

- `src/lib/` holds pure, deterministic functions only — no React, hooks, DOM or browser APIs — each with JSDoc `@param` and `@returns`. Put impure code in `src/services/`.
- Component props are typed explicitly with types from `src/types.ts`.
- Sorting and filtering run client-side. Selection is single-item.

## Known pitfalls

- `npx tsc --noEmit` checks 0 files (the root `tsconfig.json` has `"files": []`) and always passes; agents treat that as "types pass". Use `npm run build`.

<!-- /bmad:context -->

<!-- code-review-graph MCP tools -->
## MCP Tools: code-review-graph

**This project has a knowledge graph. Start with the code-review-graph
MCP tools to narrow scope, then read the source.** The graph is cheaper than scanning files and
gives you structural context (callers, dependents, test coverage) that file search cannot.

### When to use graph tools FIRST

- **Exploring code**: `semantic_search_nodes_tool` or `query_graph_tool` instead of Grep
- **Understanding impact**: `get_impact_radius_tool` instead of manually tracing imports
- **Code review**: `detect_changes_tool` + `get_review_context_tool` instead of reading entire files
- **Finding relationships**: `query_graph_tool` with callers_of/callees_of/imports_of/tests_for
- **Architecture questions**: `get_architecture_overview_tool` + `list_communities_tool`

### Verify in the source

- Narrow scope with the graph, then read the source. Do not change code from graph output alone.
- For any non-trivial change, read the implementation and the relevant tests before concluding.
- Verify the exact source when touching behavior, database logic, migrations, retries, fallbacks,
  recovery, or compatibility code.
- When the graph and the source disagree, the source wins. The graph may be stale or may not
  model that relationship.
- An empty graph result can mean "not indexed" or "not statically visible", not "does not exist".

### Key Tools

| Tool | Use when |
| ------ | ---------- |
| `detect_changes_tool` | Reviewing code changes — gives risk-scored analysis |
| `get_review_context_tool` | Need source snippets for review — token-efficient |
| `get_impact_radius_tool` | Understanding blast radius of a change |
| `get_affected_flows_tool` | Finding which execution paths are impacted |
| `query_graph_tool` | Tracing callers, callees, imports, tests, dependencies |
| `semantic_search_nodes_tool` | Finding functions/classes by name or keyword |
| `get_architecture_overview_tool` | Understanding high-level codebase structure |
| `refactor_tool` | Planning renames, finding dead code |

### Workflow

1. The graph auto-updates on file changes (via hooks).
2. Use `detect_changes_tool` for code review.
3. Use `get_affected_flows_tool` to understand impact.
4. Use `query_graph_tool` pattern="tests_for" to check coverage.
<!-- /code-review-graph MCP tools -->
