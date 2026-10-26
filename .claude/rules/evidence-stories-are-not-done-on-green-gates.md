---
date: 2026-10-26
reason: Epic 5 retro findings F1 and F2 (story 5-4 was marked done on green build, lint and tests although every browser check was NOT RUN, then walked back)
paths:
  - "_bmad-output/implementation-artifacts/sprint-status.yaml"
  - "_bmad-output/implementation-artifacts/spec-*.md"
---

# A story whose purpose is evidence is not done on green gates

Build, lint and tests only prove that code compiles and jsdom assertions hold. Story 5-4 exists to prove SM-1 to SM-3, NFR1 to NFR4 and NFR9 in a browser. All of them were NOT RUN, yet `551e1d8` set the story to `done`, and `efdfe33` reverted it. Browser checks have now been deferred from Epics 2, 3, 4 and 5. Extends [verification-gates.md](verification-gates.md), [commits-and-tracking.md](commits-and-tracking.md) and [security-claims-need-a-real-browser.md](security-claims-need-a-real-browser.md).

- If a story's acceptance criteria require a browser, timing or screen-reader result, keep it at `review` until each row of its verification record says MET with the method, or a human accepts NOT RUN in writing. Green gates are necessary, not sufficient.
- Set a story to `done` in `sprint-status.yaml` and in its spec frontmatter in the same change. `src/tracking.test.ts` fails when they disagree.
- Do not set an epic to `done`, or call v1 verified, while any of its rows is NOT RUN.
- Schedule the accumulated browser checks (deferred-work.md) as a gate before the next epic starts, not at the end.

## Bad

```
chore(sprint): mark story 5-4 done
(verification record: SM-1 NOT RUN, SM-2 NOT RUN, SM-3 NOT RUN)
```

## Good

```
5-4: review. Gates green (638 tests). SM-1 to SM-3, NFR1 to NFR4, NFR9 NOT RUN in a browser;
steps in deferred-work.md. Moves to done after a Chrome or Edge run records MET or the owner accepts the gap.
```
