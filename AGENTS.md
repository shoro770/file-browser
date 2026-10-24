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
