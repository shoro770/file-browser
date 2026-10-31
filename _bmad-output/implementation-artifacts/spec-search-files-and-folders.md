---
title: 'Search files and folders above the tree'
type: 'feature'
created: '2026-10-31'
status: 'done'
baseline_commit: '6522282c9425648c4f2c7182119cc7ff78b34d7d'
route: 'dispatch'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The tree can only be browsed by expanding folders one at a time; there is no way to find a file or folder by name, including hidden (dot) entries.

**Approach:** Add a search box at the top of the tree pane (inside its frame). Typing crawls the whole Workspace Folder read-only and replaces the tree with a filtered tree: matching entries plus their ancestor folders, ancestors expanded, matches highlighted. Match modes are toggle buttons inside the box.

## Boundaries & Constraints

**Always:**
- Read-only: the crawl uses only `listChildren` / `openChildDirectory` (`services/fs.ts`); no network, no backend, no write APIs.
- Matches name only (not path, not contents), files and folders alike. Dotfiles are always searched, regardless of the Hidden files toggle; matching dotfiles keep the dimmed style.
- Default mode: case-insensitive "contains". Toggles: **Match case**, **Whole word**, **Regex** (each `aria-pressed`, labelled). With Regex off, `*` (any run) and `?` (one char) are wildcards and all else is literal; the pattern then matches the whole name only if it contains a wildcard, else "contains". With Regex on, the query is a JavaScript regex tested against the name.
- Whole word: a match must be bounded by non-alphanumerics (or name ends); applies to contains and regex.
- Invalid regex: no crash; show an inline error ("Invalid pattern"), keep the last good results.
- Pure matching logic lives in `src/lib/` (JSDoc `@param`/`@returns`, no DOM); the crawl in `src/services/`; components reach services only via a hook.
- Tree accessibility and roving tabindex are unchanged in the filtered tree (`role="tree"`, `treeitem`, `aria-expanded`, `aria-level/setsize/posinset`, `role="group"`, one tab stop, full key map). Search box is keyboard-reachable (Tab) and `Escape` clears it; result count is announced in the `role="status"` region.
- Clearing the query restores the normal tree with its previous expansion and selection. Selecting a result selects it and shows its preview as usual.
- Crawl is cancelled/ignored when the query is cleared, the folder is reopened, or Refresh runs (index is rebuilt on next search). Show "Searching..." while it runs and results as they arrive.
- Add inline SVG only for any icon; no icon library.

**Never:**
- No fuzzy search, content search, saved searches, history, or multi-select.
- No changes to `scripts/check-readonly.mjs`, `src/architecture.test.ts`, or the existing store's read-once-per-folder semantics (crawl does not populate or mutate the store's children cache).
- No catastrophic-backtracking protection beyond catching invalid patterns.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Contains | `read` | Shows `README.md`, `.readme`, folder `spread/` + ancestors | N/A |
| Wildcard | `*.test.ts` (Regex off) | Names ending `.test.ts` | N/A |
| Whole word | `log`, Whole word on | `log.txt`, not `catalog.txt` | N/A |
| Regex | `^\.env`, Regex on | `.env`, `.env.local` | Invalid → "Invalid pattern" |
| No match | `zzz` | "No matches" message, status announced | N/A |
| Unreadable folder | crawl hits one | Skipped; rest searched | Count unaffected, no crash |
| Empty query | `''` | Normal tree | N/A |

</frozen-after-approval>

## Code Map

- `src/App.tsx` -- toolbar + `#tree-pane` (~l.170); mount `SearchBox` at the top of the pane, choose filtered vs normal `Tree`.
- `src/components/Tree.tsx` -- reuse as-is for the filtered tree by passing derived `items/rootIds/childIds/expandedIds`, `showDotfiles={true}`.
- `src/components/HiddenFilesToggle.tsx` -- pattern for `aria-pressed` toggle buttons.
- `src/services/tree.ts` -- store; `select` needs a loaded id, so selecting a not-yet-loaded result must first `toggle` its ancestors top-down (a `reveal(id)` intent), then `select`. Do not change `toggle`/`refresh` behavior.
- `src/services/fs.ts` -- `listChildren`, `openChildDirectory`; crawl builds on these.
- `src/hooks/useTree.ts` -- add `reveal`; new `src/hooks/useSearch.ts` bridges crawl to components.
- `src/lib/tree.ts` -- `isDotfileId`, `toId`, `parentId` reusable. `src/types.ts` -- add `SearchOptions`, `SearchBoxProps`.
- `src/App.css` -- styles for search box inside `.shell__tree`.

## Tasks & Acceptance

**Execution:**
- [ ] `src/lib/search.ts` + `search.test.ts` -- `compileMatcher(query, options)` and `buildSearchView(items, matches)` (matching ids + ancestors, expanded) -- pure, unit-tests the I/O matrix
- [ ] `src/services/search.ts` + test -- cancellable read-only crawl yielding `FileItem`s, skipping unreadable folders
- [ ] `src/hooks/useSearch.ts` -- query/options state, debounce, crawl lifecycle, results, error, status text
- [ ] `src/services/tree.ts`, `src/hooks/useTree.ts` -- `reveal(id)`
- [ ] `src/components/SearchBox.tsx`, `src/types.ts`, `src/App.tsx`, `src/App.css` -- box, toggles, clear button, filtered tree wiring, highlight of matched text
- [ ] `src/App.search.test.tsx` -- UI test: type, toggle modes, select a deep result, Escape restores tree, a11y roles intact

**Acceptance Criteria:**
- Given a folder with a never-expanded subfolder containing `a.txt`, when the user types `a.txt`, then it appears under its expanded ancestors.
- Given a result that is not yet loaded, when the user activates it, then it is selected and previewed.
- Given a query is active, when the user presses Escape in the box, then the full tree returns with prior expansion and selection.
- Given the tree, when the user tabs through it, then exactly one treeitem has `tabIndex=0`.

## Implementation Notes

## Spec Change Log

## Review Triage Log

| Finding | Verdict | Evidence / route |
|---|---|---|
| Reveal fails, `act()` still runs, announces "Previewing" | medium | patch: `reveal` now returns a boolean; `pick` acts only when loaded |
| Focus lost after Clear click | medium | patch: input ref refocused |
| Per-folder batch concat and refilter is quadratic | medium | patch: crawl results flushed at most every 100 ms |
| Abort not checked between sibling opens | low | patch: one-line check |
| Missing tests: keyboard follow, reveal failure | medium | patch: tests added |
| JSDoc says refresh does not recrawl | low | patch: wording corrected |
| Crawl restarts on `workspace` identity / `onAnnounce` churn | false | `rootIds` is stable between publishes; `announce` is `useCallback` |
| Unhandled reveal rejection | false | `reveal` and `toggle` never throw |
| Arrow-follow expands real tree folders | low | rejected: selecting needs the item loaded; clear fix is complex |
| Dotfile selection hidden after clear | low | rejected: one tab stop kept |
| Whole word ignored with wildcards; non-ASCII word edge; lookbehind support | low | rejected: wildcard is whole-name by design |
| Unreadable folders skipped silently | low | rejected: spec says skip |
| Invalid first regex shows empty tree | false | spec keeps last *good* results; none exists |
| User regex backtracking | low | rejected: excluded in spec Never |
| Refresh test and collapse-in-results test not added | maybe-false | deferred, see deferred-work.md |

## Verification

**Commands:**
- `npm run build` -- expected: passes
- `npm run lint` -- expected: passes
- `npm test` -- expected: passes

**Manual checks (if no CLI):**
- In Chrome/Edge, open a real folder (about 1,000 entries); search is responsive and "Searching..." shows on large trees. Not provable headlessly; report as not run if skipped.
