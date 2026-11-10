@AGENTS.md

## Tooling choices (Level 6: 3 MCPs · 1 skill · 1 command · graph-based review)

Why each piece exists, so nobody has to rediscover it. Config lives in `.mcp.json` and `.claude/`.

### MCP servers (3 in use)

| MCP | Why we use it | Use it for |
| --- | --- | --- |
| `code-review-graph` | Tree-sitter knowledge graph (callers, dependents, tests, risk scores) is cheaper than grepping files. Hooks in `.claude/settings.json` keep it fresh (`update` after Edit/Write, `status` at session start). | Exploring code, impact analysis, reviewing diffs. |
| `file-browser-quality` | Project-local server (`tools/mcp-quality-server`) that turns two project rules into callable checks: `verify_tree_node_id` (ids must be the deterministic slash-joined path, no UUID/`Math.random()`/timestamps) and `check_bundle_budget` (initial JS ≤ 150 KB gzipped). | After touching tree ids or when a change may grow the bundle. |
| `context7` | Current React / Vite / TypeScript docs instead of training-data guesses. | Library API questions only. |

- Dev-time tooling only: the app itself still makes no network requests (see Policy). `context7` is a remote HTTP server used by the agent, never by the app.
- `codebase-memory-mcp` is also in `.mcp.json` but overlaps with `code-review-graph`; it is not part of the 3 and is not used for reviews.
- The graph narrows scope; the source is the truth. Read the code and tests before changing anything.

### Skill (1): `story-commit`

`.claude/skills/story-commit/SKILL.md`. Verifies and commits exactly one finished story: scope check, `npm run build`, `npm run lint`, `npm test`, stage by name, conventional commit with a `Story: <epic>-<story>` footer. It encodes `.claude/rules/commit-story-id.md`, `verification-gates.md` and `commits-and-tracking.md`. It is `disable-model-invocation`, so it only runs when the user asks. Never marks a story `done` and never pushes.

### Command (1): `/commit-story <epic>-<story>`

`.claude/commands/commit-story.md`. Thin entry point to the skill: injects the current `git status --short`, passes the story id as the footer value, and restricts tools to read-only git plus the three gates and `git add`/`git commit`. Example: `/commit-story 1-4`.

### Graph-based review

Review with the `review-changes` skill (`.claude/skills/review-changes/SKILL.md`), driven by `code-review-graph`:

1. `detect_changes_tool` for risk-scored changes, test gaps and affected flows.
2. `query_graph_tool` with `pattern="tests_for"` on high-risk functions.
3. `get_impact_radius_tool` / `get_affected_flows_tool` when the blast radius is unclear.
4. Report findings by risk, then read the source before acting. Start with `get_minimal_context_tool`; keep to about five graph calls.

The other graph skills (`explore-codebase`, `debug-issue`, `refactor-safely`) come with the server and follow the same rule. `add-util` is a separate project skill for scaffolding `src/lib/` helpers.
