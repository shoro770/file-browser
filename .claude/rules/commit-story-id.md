---
date: 2026-10-25
reason: Epic 1 Retrospective open item A4 (commits lacked story IDs in scope)
---

# Every story commit names its story

Tooling could not attribute commits to stories, so the retro had to infer the mapping. Extends [commits-and-tracking.md](commits-and-tracking.md).

- Subject is a conventional commit: `type(scope): summary`.
- Add a footer line `Story: <epic>-<story>`, above the Co-Authored-By line.
- One commit per story.

## Bad

```
update tree stuff
```

```
feat(tree): select a file
```

(no `Story:` footer, so the commit cannot be attributed)

```
feat: Story 1-4 select a file
```

(story id in the subject instead of the footer, and no scope)

## Good

```
feat(tree): select a file

Story: 1-4

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
```
