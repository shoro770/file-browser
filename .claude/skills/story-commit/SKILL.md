---
name: story-commit
description: Verifies and commits one finished story. Runs build, lint and tests, checks that only intended files changed, then writes a conventional commit with a `Story:` footer. Use when the user asks to commit a story or says a story is ready to commit.
disable-model-invocation: true
allowed-tools: Read, Grep, Bash(npm run build:*), Bash(npm run lint:*), Bash(npm test:*), Bash(git status:*), Bash(git diff:*), Bash(git log:*), Bash(git add:*), Bash(git commit:*)
---

# story-commit

Commit exactly one finished story, with the gates passed and the story attributable.
Rules come from `.claude/rules/commit-story-id.md`, `verification-gates.md` and `commits-and-tracking.md`.

## Checklist

1. **Identify the story.** Take `<epic>-<story>` (e.g. `1-4`) from the user or the branch/sprint file. If unclear, ask. Never guess.
2. **Check scope.** Run `git status` and `git diff --stat`. Every changed file must belong to this story. If files from another story or outside the task are present, stop and report them. One commit per story.
3. **Verify.** Run, in order, `npm run build`, `npm run lint`, `npm test`.
   - `npm run build` is the type check. `npx tsc --noEmit` checks nothing; do not use it.
   - Never edit, weaken or bypass `scripts/check-readonly.mjs` or any test to get green.
4. **On any failure: verify -> fix -> repeat.**
   1. Read the failing output and find the root cause.
   2. Fix the code (inside the story's scope only).
   3. Re-run **all three** gates from step 3, not just the one that failed.
   4. Repeat until all pass. After 3 failed rounds on the same error, stop and report it with the output. Do not commit.
5. **Manual checks.** If the story needs a real folder picker, performance targets (~1,000 entries open < 300 ms, expand < 100 ms) or visual states, those cannot be proven headlessly. Say "not run" for them unless the user confirms a Chrome/Edge check.
6. **Stage by name.** `git add <files>` for the story's files only. No `git add -A` or `.`. Re-run `git status` to confirm only the intended files are staged.
7. **Commit.** Use the format below, via heredoc.
8. **Report.** State which gates passed, which manual checks were not run, and the commit hash. Do not mark the story `done` in `sprint-status.yaml`; that needs an independent check.

## Commit format

```
type(scope): summary

Story: <epic>-<story>

Co-Authored-By: <model attribution line from the session>
```

- `type(scope): summary` is a conventional commit. The scope is required (`feat(tree): select a file`).
- Never put the story id in the subject.
- The `Story:` footer goes above the `Co-Authored-By` line.
- Only commit when the user asked; never push.
