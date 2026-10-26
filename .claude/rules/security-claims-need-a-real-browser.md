---
date: 2026-10-26
reason: Epic 3 retro finding 8 (CSP and zero-request claims were backed only by jsdom, which loads no resources and enforces no CSP)
paths:
  - "index.html"
  - "vite.config.ts"
  - "src/services/sanitize.ts"
  - "src/components/preview/**"
  - "scripts/fixtures/**"
---

# A security claim is verified in a real browser or reported as not run

Story 3.4 shipped a meta CSP and a hostile-Markdown fixture, but `hostile.test.ts`, `csp.test.ts` and `rendererLint.test.ts` only read strings and sanitized DOM. jsdom neither fetches images nor enforces a CSP, so none of them can show that a request was blocked or that the PDF viewer works under `object-src blob:`. Extends [verification-gates.md](verification-gates.md).

- Say "the app works under the CSP", "no outbound requests" or "the PDF embed is allowed" only after a run against `npm run build && npm run preview` in Chrome or Edge with the console and network panel observed. Record the procedure and result in the story notes.
- Without that run, write "not run in a browser" in the story, the commit body and the retro. jsdom tests prove DOM shape only.
- Never relax the production CSP string or the sanitizer to make a check pass. A dev-server relaxation is never evidence.
- The sanitizer (`services/sanitize.ts`) is the first wall and the CSP is the second. Keep both.

## Bad

```
Story 3.4 done: hostile.md renders with zero requests and no CSP violations.
(evidence: hostile.test.ts passes in jsdom)
```

## Good

```
Story 3.4: sanitizer and CSP implemented; jsdom tests cover DOM shape.
SM-3 (zero requests) and PDF-under-CSP NOT RUN in a browser; steps in the spec's Implementation Notes.
```
