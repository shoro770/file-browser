# Commits and story tracking

Epic 1 retro (A4): commit subjects did not name story ids, so tooling could not attribute commits to stories and the retro had to infer the mapping.

- Name the story in every story commit with a footer line `Story: <epic>-<story>` (for example `Story: 1-4`), above the Co-Authored-By line.
- One commit per story, subject in conventional form (`feat(tree): select a file`).
- A story is `done` in `sprint-status.yaml` only after build, lint and tests pass in an independent check. The epic itself moves to `done` only after its manual browser check and an epic-wide `bmad-review` (retro A2, A3), not when the last story lands.
