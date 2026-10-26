---
title: 'Lock the page down and prove nothing leaves it'
type: 'feature'
created: '2026-10-26'
status: 'in-review'
baseline_commit: 'c9051d8bf31a2d6820059632b7166d26fe05aa3d'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-3-context.md'
  - '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-file-browser-2026-10-25/ARCHITECTURE-SPINE.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** `index.html` has no Content-Security-Policy, so the sanitizer is the only wall between a hostile file and the network. The zero-outbound-request claim (SM-3) has never been shown against a production build, and `npm run lint` does not itself fail on renderer `fetch(` or on `.style.cssText`.

**Approach:** Add the AD-12 meta CSP to `index.html`, relaxed only in the dev server and never as evidence. Verify the app and the PDF embed under it in `vite build` + `vite preview`. Run a hostile-Markdown zero-request check and record it. Add a renderer lint gate that `npm run lint` runs. The sanitizer stays the first wall.

## Boundaries & Constraints

**Always:** Production CSP starts as exactly `default-src 'self'; connect-src 'none'; img-src 'self' blob: data:; object-src blob:; style-src 'self'; script-src 'self'; base-uri 'none'; form-action 'none'`. Change it only where a measured break requires, one directive at a time, each deviation and reason recorded in Implementation Notes. Never add `unsafe-inline` or `unsafe-eval` to the production string. The dev relaxation lives in `vite.config.ts` (`apply: 'serve'` only), and its output is never cited as evidence. Evidence comes from `vite build` + `vite preview` in Chrome or Edge. Document in `index.html` that a meta CSP is a second wall, not a guarantee: it cannot set `frame-ancestors` and does not stop top-level navigation, so the sanitizer stays the first wall. New gate runs inside `npm run lint`. All of `.claude/rules/*.md` applies; commit subject `feat(security): lock the page down` with footer `Story: 3-4` above Co-Authored-By.

**Never:** Edit or weaken `scripts/check-readonly.mjs`, `src/architecture.test.ts`, `services/sanitize`, `AGENTS.md`, or any renderer to pass a check. Relax the CSP or the sanitizer for a size or speed target (SM-C1). Add a backend, network request, dependency or inline `style`. Write the user's files. Commit in this planning pass.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Production load | `vite preview` | Tree, selection, text, image, Markdown, DOCX, PDF previews work; theme variables apply; no CSP violation in the console | Any violation → minimal directive change, recorded |
| PDF embed | PDF selected under CSP | Viewer renders from the `blob:` URL | If blocked, add the least directive (likely `frame-src blob:`) and record why |
| Hostile `.md` | Remote image, `<script>`, `<img onerror>`, `javascript:` link, remote link, `style` attribute | Zero requests, nothing runs, "Remote image blocked", links inert text | Any request or execution → fix the sanitizer, not the CSP |
| Dev server | `npm run dev` | App works; relaxed CSP is separate | N/A |
| Renderer bans | `fetch(`, `style=`, `.style.`, `cssText` in `components/preview/` non-test code | `npm run lint` exits non-zero naming file and line | N/A |

</frozen-after-approval>

## Open Questions

Non-interactive run: each default is applied in the tasks. A human can overturn it.

- Lint gate home — default: new `scripts/check-renderers.mjs` chained in `package.json` `lint`, because `check-readonly.mjs` and `architecture.test.ts` are off limits and `architecture.test.ts` runs only under `npm test`. Alternative: also extend the scanner with `.style.`/`cssText` (needs the owner's go-ahead).
- Dev relaxation — default: Vite `transformIndexHtml` (serve only) rewrites the meta to allow the React refresh preamble and HMR (`'unsafe-inline'` script and style, `connect-src ws:`). Alternative: no CSP in dev. Verify the exact needs by running `npm run dev`.
- Browser evidence — headless CLI cannot show the CSP console or network panel. Default: run in Chrome or Edge (browser tools if available), else report as not run and keep the story out of `done`.
- PDF viewer frame — `object-src blob:` may not cover Chromium's internal viewer frame (falls to `default-src 'self'`). Default: test first; record any change.
- Fixture location — default `scripts/fixtures/hostile.md`, reused by a jsdom test and the manual check.

## Code Map

- `index.html` -- add the meta CSP and the second-wall comment; no inline script or style.
- `vite.config.ts` -- add the serve-only plugin; keep the `mammoth` test alias. Type-checked by `tsconfig.node.json`.
- `scripts/check-renderers.mjs` (new) -- walks a directory (arg, default `src/components/preview`), skips `*.test.*`, strips comments like `architecture.test.ts`, fails on `fetch(`, `style=`, `.style.`, `cssText`, `setAttribute('style'`.
- `package.json` -- `lint`: `oxlint && node scripts/check-readonly.mjs && node scripts/check-renderers.mjs`.
- `scripts/fixtures/hostile.md` (new) -- the six hostile items from the AC.
- `src/csp.test.ts` (new) -- reads `index.html`; asserts the meta exists, directives match the recorded string, no `unsafe-*`.
- `src/services/hostile.test.ts` (new) -- renders the fixture through `renderMarkdown`; asserts no `script`, `on*`, `style`, off-page `src`/`href`, placeholder present.
- `src/rendererLint.test.ts` (new) -- runs the script on temp dirs: clean passes, each ban fails.
- Reuse: `services/markdown.ts`, `services/sanitize.ts`, `PreviewPane` as is. Do not change them.
- `deferred-work.md` -- close the 3.1–3.3 browser-check and CSP entries that this story's run settles; append what it does not.
- `sprint-status.yaml` -- `3-4-...: ready-for-dev` (this pass); `in-progress` and review states are step-03/04's.

## Tasks & Acceptance

**Execution:**
- [x] `scripts/fixtures/hostile.md` -- write the hostile file -- repeatable SM-3 input
- [x] `scripts/check-renderers.mjs`, `package.json`, `src/rendererLint.test.ts` -- gate plus tests, chained into `lint` -- AD-12, AD-13
- [x] `index.html`, `vite.config.ts`, `src/csp.test.ts` -- production CSP, serve-only relaxation, guard test -- AD-12
- [x] `src/services/hostile.test.ts` -- fixture through the real pipeline -- AD-11
- [ ] **NOT RUN** `npm run build && npm run preview` in Chrome or Edge, console and network panels open -- exercise tree, selection, text, image, Markdown, DOCX, PDF, three themes; open the hostile fixture; record violations, deviations, request count and procedure in Implementation Notes -- SM-3 evidence
- [x] `deferred-work.md`, Implementation Notes -- close or carry entries; record gzip sizes (initial JS must stay under 150 KB) -- retro lessons
- [x] `npm run build`, `npm run lint`, `npm test`, `git status --short` -- only files named here, this spec, `sprint-status.yaml`

**Acceptance Criteria:**
- Given `index.html`, then it carries the meta CSP (as adjusted) and states it is a second wall, with each deviation recorded.
- Given `vite preview`, then every preview kind renders, themes apply and the console shows no CSP violation.
- Given a PDF under the CSP, then `object-src blob:` is shown sufficient, or the minimal change and reason are recorded.
- Given the hostile file in `vite preview`, then the network panel shows zero outbound requests and nothing executes; procedure and result are recorded.
- Given a renderer with `fetch(`, `style=` or `.style.cssText`, then `npm run lint` fails.
- Given the three gates, then all pass.

## Implementation Notes

**Built:** meta CSP in `index.html` (exact AD-12 string, **no deviations**, because no browser run measured a break); serve-only `devCsp` plugin in `vite.config.ts` (adds `'unsafe-inline'` script and style and `ws:` for HMR; throws if the production string changes shape; never used as evidence); `scripts/check-renderers.mjs` chained into `npm run lint` (bans `fetch(`, `XMLHttpRequest`/`sendBeacon`/`WebSocket`/`EventSource`/`new Image`, `style=`, `.style`, `['style']`, `cssText`/`setProperty`, `setAttribute('style')` in non-test `src/components/preview/`; fails if the directory is missing or empty); `scripts/fixtures/hostile.md`; tests `csp.test.ts`, `rendererLint.test.ts`, `services/hostile.test.ts`.

**Measured with `vite build`:** initial JS `index-*.js` 250.42 kB, **78.81 kB gzip** (budget 150 kB); `PdfPreview` 0.40 kB gzip. No new dependency.

**Checks:** `npm run build`, `npm run lint` and `npm test` pass (366 tests).

**NOT RUN — browser evidence.** Google Chrome exists at `/Applications/Google Chrome.app`. I tried a throwaway headless run (CDP script outside the repo, `vite preview`, a faked directory picker injected over CDP). The sandbox refused to let me write the script outside the repo, so I did not run it and did not move it into the repo. Therefore **no claim is made** for: the app working under the CSP in `vite build` + `vite preview` (tree, text, image, Markdown, DOCX, PDF, themes), zero console CSP violations, the PDF embed under `object-src blob:` (Chromium's viewer frame may need `frame-src blob:`), or the SM-3 zero-request result for the hostile fixture. What exists is a jsdom proof that the fixture renders inert (no script, handler, `style`, off-page `src`/`href`, "Remote image blocked" shown), which loads nothing and enforces no CSP. Procedure to run: `npm run build && npm run preview`, Chrome or Edge with DevTools Network (filter off) and Console open, open a folder containing `scripts/fixtures/hostile.md`, a PDF, a PNG, a `.docx` and a text file, select each, expect zero requests to `evil.example` and no "Refused to ..." console lines. The story is therefore not proven done on the CSP and SM-3 criteria.

**Second wall:** a meta CSP cannot set `frame-ancestors` and does not stop top-level navigation; the sanitizer stays the first wall (stated in `index.html`).

## Review Triage Log

Three layers ran (Blind Hunter, Edge Case Hunter, Verification Gap). Loopbacks: none.

| Finding (source) | Verdict | Route | Evidence |
|---|---|---|---|
| CSP never run in a browser; PDF viewer frame, worker/font/media unmeasured (all three) | medium (unverified) | defer | Needs Chrome/Edge; logged in `deferred-work.md` and stated as not run. |
| Dev plugin `.replace` silently no-ops if the string changes (BH, EC, VG) | low | patch | Now throws when a swap target is missing; swaps anchored with a leading space. |
| Gate misses `XMLHttpRequest`, `sendBeacon`, `WebSocket`, `new Image`, `['style']`, `setProperty` (BH, EC) | medium | patch | Added to the ban list; tested. |
| `style=` matches variables named `style` (BH, EC) | low | patch | Lookbehinds exclude `const/let/var` and member access; test added. |
| Line-split `fetch\n(` / `style\n=` escape (BH, EC) | medium | patch | Scan is now over the whole stripped text with line mapping; tests added. |
| Missing or empty directory passes silently (BH, EC) | medium | patch | Exits 1 with a message; tested. |
| Hostile fixture lacks iframe/object/form/base/meta/style/svg/srcset vectors (BH, EC) | medium | patch | Fixture extended; jsdom test asserts all are gone. |
| Comment stripper eats `//` inside strings (BH, EC, VG) | low | rejected | Same trade-off as `architecture.test.ts`; fix needs a tokenizer. |
| `frame-ancestors` assertion only matches the comment (BH) | low | rejected | The AC requires that documentation; the assertion pins it. |
| `csp.test.ts` reads source, not `dist`; regex tied to attribute order (BH, EC, VG) | low | rejected | Fails loudly with the expected string; the built page is covered by the manual check. |
| Gate scans only `components/preview`, not `services/` (BH, VG) | low | defer | AC scopes the gate to renderers; logged. |
| Hostile test is Markdown only; no fetch/XHR spy (BH, EC) | low | defer | DOCX has sanitizer tests (Story 3.2); logged. |
| `data:` in `img-src` wider than needed (EC) | false | rejected | Required by the AD-12 string and by mammoth `data:` images. |
| Separate `check:renderers` npm script (BH) | low | rejected | Cosmetic. |

## Design Notes

`connect-src 'none'` blocks `fetch` of `blob:` too, which is why no renderer fetches (Story 3.3 already removed PDF `fetch`). `style-src 'self'` blocks style attributes, so the CSS-class rule stays binding. Keep the dev string visibly separate from the production string.

## Verification

**Commands:**
- `npm run build` -- exits 0; note chunk gzip sizes
- `npm run lint` -- exits 0 with the new gate
- `npm test` -- all pass
- `git status --short` -- only intended files

**Manual checks (if no CLI):** `npm run build && npm run preview` in Chrome or Edge as above; if not run, report it as not run.
