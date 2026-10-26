---
title: 'Run the release verification'
type: 'chore'
created: '2026-10-26'
status: 'in-review'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: '71af22f2ad249f9efc315e6a4d91a1b79e628034'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-5-context.md'
  - '{project-root}/_bmad-output/implementation-artifacts/epic-2-context.md'
  - '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-file-browser-2026-10-25/ARCHITECTURE-SPINE.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** v1 has no single record showing it meets SM-1 to SM-4, NFR1 to NFR4 and the policy gates. Most earlier browser checks were deferred as NOT RUN, so no performance, CSP or zero-request result exists.

**Approach:** Run every command-checkable gate now and record the result. Run each browser or real-folder check in Chrome or Edge against `npm run build && npm run preview`, or report it NOT RUN with its steps. Write one verification record in Implementation Notes. Missed targets are reported as defects, never relaxed.

## Boundaries & Constraints

**Always:** Record each SM-1 to SM-4, NFR1 to NFR4, NFR9 and policy gate with result, command or method, and the story that owns any defect. SM-5 is a post-release observation, not a gate. Measure against `vite build` + `vite preview`, never the dev server. Targets: UJ-1 under 30 s; about 1,000 entries tree under 300 ms and folder expand under 100 ms; 1 MB text under 100 ms; typical `.docx` under 5 MB under 1 s; initial JS under 150 KB gzipped (read from `vite build` output); about 2,000 entries in one folder stays responsive. Say "no outbound requests", "works under the CSP" or "PDF embed allowed" only after a Chrome or Edge run with console and network panel observed (`.claude/rules/security-claims-need-a-real-browser.md`); otherwise write "not run in a browser". Command gates: `npm run build`, `npm run lint`, `npm test`. Gate greps: no `createWritable`, `removeEntry`, `move`, `readwrite`, `FileSystemWritableFileStream`; no `fetch(` or inline `style` in renderers; no icon library in `package.json`; `FileRow` component, `MOCK_FILES`, `countPdfPages`, `openedItems` absent from `src/` and `scripts/`. Fix a defect only if it is a small, clearly owned fix; otherwise record it. Commit (when later asked) as `test(release): run the release verification`, footer `Story: 5-4` above the Co-Authored-By line. Run `git status` after.

**Never:** Do not edit `scripts/check-readonly.mjs`, `src/architecture.test.ts`, `src/rendererLint.test.ts`, `epics.md`, theme tokens, the CSP string or the sanitizer to make a check pass. No new dependency, backend, network call or icon library; no writes to the user's files. No weakening of sanitization, CSP, keyboard or screen-reader support for speed or size (SM-C1, SM-C2). Do not mark SM-2 or NFR items met without a measurement; do not mark `done` in `sprint-status.yaml` before an independent build, lint and test pass.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior |
|---|---|---|
| Target met | Measured under limit | Recorded with value, method, machine, browser |
| Target missed | Measured over limit | Recorded as a defect with owning story; target unchanged |
| Not measurable here | No browser, folder or screen reader | Recorded NOT RUN with exact steps, never inferred from jsdom |
| Non-Chromium | Firefox or Safari | Unsupported-browser screen (NFR9); NOT RUN if no such browser |

</frozen-after-approval>

## Open Questions

- Stale `FileRow` in `AGENTS.md` line 16 (the component is gone; `TreeNode` carries the treeitem role) — options: record it as a defect and leave `AGENTS.md` untouched (default, outside this story's scope) / edit that one name in `AGENTS.md` (the AC also wants `AGENTS.md` free of `listbox`/`option`, which already holds).
- Bundle budget has no automated check (epic 3 retro item 15) — options: measure by hand from `vite build` output and record (default) / add a `scripts/` check wired into `npm run lint` (new file, extends scope).
- Browser, folder-picker, timing and screen-reader checks need a human in Chrome or Edge — options: the implementer runs what it can and reports the rest NOT RUN (default) / Shneor runs them and supplies results (the only route to a "met" result for SM-1 to SM-3).

## Code Map

- `package.json` -- scripts (`build`, `lint`, `test`, `preview`) and the icon-library check (deps: dompurify, mammoth, marked, react, react-dom).
- `vite.config.ts` -- dev-only CSP relaxation; never evidence. `index.html` -- production meta CSP (read-only).
- `scripts/check-readonly.mjs`, `scripts/check-renderers.mjs` -- the AD-13 and AD-12 gates run inside `npm run lint`; read-only to this story.
- `scripts/fixtures/hostile.md` -- hostile Markdown for the SM-3 zero-request run.
- `src/architecture.test.ts`, `src/csp.test.ts`, `src/hostile`-related tests under `src/services/` -- structural proof only (jsdom).
- `AGENTS.md` -- tree semantics present; stale `FileRow` name (open question).
- `_bmad-output/implementation-artifacts/deferred-work.md` -- many NOT RUN browser entries (2.2, 2.3, 3.1 to 3.4, 4.1 to 4.3, 5.1 to 5.3). Results here close them; add an entry for any left NOT RUN.
- `_bmad-output/implementation-artifacts/sprint-status.yaml` -- story key `5-4-run-the-release-verification`; epic 5 stays open until the manual check and an epic-wide `bmad-review`.

## Tasks & Acceptance

**Execution:**
- [x] `_bmad-output/implementation-artifacts/spec-5-4-run-the-release-verification.md` -- run `npm run build`, `npm run lint`, `npm test`; record exit codes, test count and the gzip size of initial JS from `vite build` -- SM-4, AD-15
- [x] same -- grep the policy gates (list above) over `src/`, `scripts/`, `package.json`, `AGENTS.md`; record counts -- AD-3, AD-12, AD-13, FR3, FR25
- [x] same -- in Chrome or Edge on `npm run build && npm run preview`: timed UJ-1, 1,000-entry open and expand, 1 MB text, 5 MB `.docx`, 2,000-entry folder; record times and steps, or NOT RUN -- SM-1, SM-2, NFR1 to NFR4 (done as recorded NOT RUN; nothing was measured)
- [x] same -- UJ-2 checklist: dotfile toggle, three themes, binary and zero-byte Metadata Cards ("This file is empty."), `hostile.md` with Network and Console open (expect zero requests, no "Refused to"), PDF embed under the CSP; non-Chromium unsupported screen, or NOT RUN -- SM-3, NFR5, NFR6, NFR9 (done as recorded NOT RUN; nothing was observed)
- [x] same -- write the verification record in Implementation Notes: each SM, NFR and gate with result, method, owner of open defects; SM-5 as post-release note; counter-metrics statement (SM-C1, SM-C2) -- final AC
- [x] `_bmad-output/implementation-artifacts/deferred-work.md` -- add one entry per check left NOT RUN, with steps
- [x] `_bmad-output/implementation-artifacts/sprint-status.yaml` -- `review` when the record is complete; `done` only after an independent build, lint and test pass

**Acceptance Criteria:**
- Given SM-1, when UJ-1 is timed, then time and steps are recorded and under 30 s, or it is reported NOT RUN or a defect.
- Given SM-2 and NFR1 to NFR3, when measured, then each value, method and machine is recorded; a miss is a defect and the target is unchanged.
- Given NFR4, when a 2,000-entry folder opens, then responsiveness is recorded or NOT RUN.
- Given SM-3, when UJ-2 runs against `vite build` + `vite preview`, then zero outbound requests and the Metadata Cards are recorded as observed, otherwise "not run in a browser".
- Given SM-4 and the policy gates, then build and lint pass and every grep result is recorded.
- Given the counter-metrics, then the record states no result relied on weakened sanitization, CSP, keyboard or screen-reader support.
- Given the story is complete, then only the spec, `deferred-work.md` and `sprint-status.yaml` changed in `git status` (plus any recorded defect fix).

## Implementation Notes

Run on 2026-10-26, macOS (Darwin 25.1.0), baseline `71af22f`. Open-question defaults applied: `AGENTS.md` untouched (stale `FileRow` recorded as a defect); bundle size read by hand from `vite build` output, no new script; browser checks NOT RUN, because no browser could be launched in this session (launching Chrome needed an approval the non-interactive session cannot give, and a folder picker needs a user gesture). Driving headless Chrome through Playwright or Puppeteer was considered and rejected: it would add a dependency, and the folder-dependent checks would still need a real picker. Nothing below is inferred from jsdom.

### Verification record

| Item | Result | Command or method |
|---|---|---|
| SM-4 type check and build | MET | `npm run build`: `tsc -b` then `vite build`, 312 modules, built with no errors |
| SM-4 lint | MET | `npm run lint`: oxlint, `check-readonly: ok`, `check-renderers: ok (9 files)`, exit 0 |
| Tests (verification-gates rule) | MET | `npm test`: 38 files, 638 tests passed |
| AD-15 (SM-2) initial JS under 150 KB gzip | MET (static, from build output; not confirmed by a browser load) | `vite build` gzip column, JS only: `index-*.js` 80.62 KB + modulepreloaded `rolldown-runtime-*.js` 0.71 KB = 81.33 KB. `dist/index.html` has one `<script>` and one `modulepreload`, both of those; `index-*.js` statically imports only the runtime chunk. `lib-*.js` (95.11 KB, underscore pulled in by mammoth), `RenderedContent`, `MarkdownPreview`, `DocxPreview` and `PdfPreview` are separate chunks not referenced from `index.html` |
| AD-13 read-only gate | MET | `check-readonly: ok` (its pattern is `createWritable|removeEntry|\.move\(|readwrite|FileSystemWritableFileStream`); `grep -rnE --exclude='*.test.*' "createWritable|removeEntry|FileSystemWritableFileStream|readwrite|\.move\("` over `src/` = 0 matches; a bare `\bmove\b` over `src/`, `scripts/check-renderers.mjs` and `package.json` matches only three English comments (`ThemeSwitch.tsx`, `lib/tree.ts`, `services/headings.ts`), no calls |
| AD-12 no `fetch(`, XHR, WebSocket, beacon, EventSource, `new Image(`, inline `style=`, `.style`, `cssText` in shipped code | MET | `grep -rnE --exclude='*.test.*' "\bfetch\s*\(\|style=\|\.style\b\|cssText\|XMLHttpRequest\|WebSocket\|sendBeacon\|EventSource\|new Image\("` over `src/`: no match in any `.ts` or `.tsx` file. Two non-shipped hits: `src/testDocx.ts` (test helper building a `w:pStyle` string, imported only by tests) and the unreferenced `src/assets/vite.svg` (defect D2) |
| AD-12 renderer gate | MET | `check-renderers: ok (9 files)` |
| No icon library | MET | grep for lucide, fontawesome, react-icons, heroicons, phosphor, tabler in `package.json` = 0; dependencies are dompurify, mammoth, marked, react, react-dom |
| No backend or external request in code | MET (code) | no network API in shipped source (grep above); production CSP string in `dist/index.html` has `connect-src 'none'`. Runtime requests NOT RUN, see SM-3 |
| `FileRow`, `MOCK_FILES`, `countPdfPages`, `openedItems` gone | MET for code | grep over `src/` and `scripts/` = 0. One stale `FileRow` remains in `AGENTS.md` line 16 (defect D1) |
| `AGENTS.md` uses tree semantics, no `listbox`/`option` | MET | grep `listbox|role=.option` over `AGENTS.md`, `CLAUDE.md`, `src` = 0; line 16 mandates `role="tree"`, `treeitem`, `group` |
| Tree a11y roles in code | MET (code) | `src/components/Tree.tsx:217` `role="tree"`; `TreeNode.tsx:23,76` `treeitem`; `:108` `group` |
| SM-1 UJ-1 under 30 s | NOT RUN | needs a human in Chrome or Edge with a real folder (picker needs a user gesture); steps in `deferred-work.md` |
| SM-2 / NFR1 tree of about 1,000 entries under 300 ms | NOT RUN | needs a real folder and a browser |
| SM-2 / NFR2 expand under 100 ms | NOT RUN | same |
| SM-2 / NFR3 1 MB text under 100 ms; 5 MB `.docx` under 1 s | NOT RUN | same; the `.docx` figure includes the first lazy chunk load |
| NFR4 about 2,000 entries in one folder responsive | NOT RUN | same |
| SM-3 / NFR5 / NFR6 zero outbound requests for `scripts/fixtures/hostile.md` under `vite build` + `vite preview` | NOT RUN in a browser | jsdom tests prove DOM shape only (`.claude/rules/security-claims-need-a-real-browser.md`); no network panel observed |
| PDF embed allowed under the CSP | NOT RUN in a browser | no viewer observed |
| SM-3 dotfile toggle, three themes legible, binary and zero-byte Metadata Cards | NOT RUN in a browser | covered by jsdom and stylesheet tests only |
| NFR9 unsupported-browser screen in a non-Chromium browser | NOT RUN | no Firefox or Safari launched; jsdom test covers the screen only |
| Screen reader and keyboard pass (carried from 5.3) | NOT RUN | needs VoiceOver or NVDA; tracked by the Story 5.3 entry in `deferred-work.md` |
| SM-C1 / SM-C2 counter-metrics | MET | `git diff --stat 71af22f` (baseline) shows this story changed only `deferred-work.md`, `sprint-status.yaml` and this spec: no source, CSP, sanitizer, keyboard, screen-reader or gate file. Every result above was measured on the baseline code |
| SM-5 daily use by the author | Post-release observation | not a gate |

### Open defects

- D1 `AGENTS.md` line 16 names the removed `FileRow`; `TreeNode` carries the `treeitem` role. Owner: Story 1.2 and 1.3 rename. Not fixed here (agent-context file, accepted default); entered in `deferred-work.md`.
- D2 `src/assets/hero.png`, `react.svg`, `vite.svg` are unreferenced Vite template leftovers (not in the build output; `vite.svg` holds an inline `<style>`). Owner: Story 1.1. Low; not fixed, outside scope.
- D3 No automated bundle budget check; the 81.33 KB figure is a one-off reading. Tracked by the open action item `epic-3-retro-item-15-add-an-automated-initial-bundle-budget-c` in `sprint-status.yaml`; owner Story 3.1 to 3.4 (the story that first added a heavy dependency).

### Release readiness

Code-checkable gates all pass. SM-1, SM-2, SM-3, NFR1 to NFR4, NFR9 and the CSP and zero-request claims are unproven until the browser checks in `deferred-work.md` are run; v1 should not be called verified before then.

## Spec Change Log

## Review Triage Log

| Finding (layer) | Verdict | Route | Evidence |
|---|---|---|---|
| Sprint status `in-progress` while spec says in-review and task ticked (blind, edge) | medium | patch | `sprint-status.yaml` set to `review` before commit. |
| NFR1 id used for both bundle size and tree-open time (edge) | low | patch | Bundle row relabelled AD-15 (SM-2). |
| AD-12 row says 0 matches yet names hits; grep text and scope not exact (blind, edge) | medium | patch | Row now gives the exact command and names the two non-shipped hits; `testDocx.ts` verified test-only by import search. |
| Bare `move` and `scripts/` not covered by grep (edge) | low | patch | Broader grep run; only three English comments match. |
| Ticked tasks overstate NOT RUN work (blind) | low | patch | Tasks annotated "done as recorded NOT RUN". |
| SM-C1/C2 MET lacks diff evidence; bundle sentence non-sequitur (blind) | low | patch | Cites `git diff --stat 71af22f`; sentence removed. |
| Headless-browser alternative not discussed (blind) | low | patch | Note explains Playwright or Puppeteer needs a dependency and still no picker. |
| D3 and screen-reader pass lack a pointer (blind, edge) | low | patch | Record cites the action-item id and the 5.3 entry. |
| Deferred CSP wording could invite relaxing the CSP (blind, edge) | medium | patch | Entry now routes a block to a Story 3.4 defect and a separate story. |
| No fixture guidance for 1,000 and 2,000 entries (blind) | low | patch | Entry says how to build them outside the repo. |
| Review diff files appear in `git status` (blind, edge) | low | patch | Deleted before the commit. |
| Cited rule file may not exist (blind) | false | rejected | `.claude/rules/security-claims-need-a-real-browser.md` was loaded into this session's instructions. |
| Test counts and 312 modules lack a saved log (blind) | low | rejected | Figures are from this session's command output; a saved log adds a file for no named harm. |
| D1 owner is a guess; fix is deferred (blind) | low | rejected | Deferral follows the triage rule that agent-context edits are deferred; D1 has a `deferred-work.md` entry. |
| Story cannot be `done` with browser checks unrun (blind) | maybe-false | rejected | Decision belongs to the orchestrator; Release readiness states v1 is not verified until they run. |
| Verification gap layer | none | n/a | Reported no gaps. |

## Design Notes

Reuse the lessons from epics 2 to 5: `npm run build` is the type check (`npx tsc --noEmit` checks nothing); jsdom proves DOM shape only; a gate is never edited to pass. Timing method for the browser: Performance panel or `performance.now()` around open and expand, median of 3, cold tab, noting machine, OS and browser version.

## Verification

**Commands:**
- `npm run build` -- exit 0
- `npm run lint` -- exit 0, includes the read-only and renderer gates
- `npm test` -- all pass
- `git status` -- only the files in Tasks

**Manual checks:**
- Chrome or Edge on `npm run build && npm run preview`: UJ-1 and UJ-2 timed with Network and Console open; a non-Chromium browser for the unsupported screen. NOT RUN until done.
