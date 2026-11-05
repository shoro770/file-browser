---
description: Verify and commit one finished story (build, lint, tests, scope check, Story footer).
argument-hint: "<epic>-<story>, e.g. 1-4"
arguments: [story]
allowed-tools: Read, Grep, Bash(git status *), Bash(git diff *), Bash(npm run build *), Bash(npm run lint *), Bash(npm test *), Bash(git add *), Bash(git commit *)
---
Commit story **$story** by following the checklist below exactly. Use `$story` as the `Story:` footer value.

Current changes (read-only snapshot):

!`git status --short`

@.claude/skills/story-commit/SKILL.md
