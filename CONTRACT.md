# CONTRACT: what the agent may do here

Read this on day one. Every rule names what enforces it. Rules marked **advisory only** have no machine check: they rely on the agent and on review.

Config lives in `.claude/settings.json`; hook scripts in `.claude/hooks/` (fixtures in `.claude/hooks/samples/`).

**Status key**: ✅ active now · ⏸️ script exists but is parked under `_disabled_hooks` in `settings.json` (not running) · ⚠️ advisory only.

## 1. May do autonomously

| Action | Enforcer |
| --- | --- |
| `npm test`, `npm run check`, `npm run lint`, `npm run typecheck`, `npm run build` | ✅ `permissions.allow` (`Bash(npm test *)`, `Bash(npm run check *)`, `Bash(npm run lint *)`, `Bash(npm run typecheck *)`, `Bash(npm run build *)`) |
| `git status`, `git diff`, `git log` | ✅ `permissions.allow` (`Bash(git status *)`, `Bash(git diff *)`, `Bash(git log *)`) |
| Edit source files in `src/` | ⚠️ advisory only (no allow rule; the default prompt applies) |
| Edit `src/lib/` | ✅ allowed, but `post-edit-check.mjs` (PostToolUse) flags React, `services/`/`components/`/`hooks/` imports and browser globals (`window`, `document`, `localStorage`, `fetch`…) and sends the finding back to the agent (exit 2) |

## 2. Must ask a human first

| Action | Enforcer |
| --- | --- |
| `git push` | ✅ `permissions.ask` (`Bash(git push *)`, `Bash(git push)`) |
| `npm install`, `npm i`, `npm uninstall` (dependency changes) | ✅ `permissions.ask` (`Bash(npm install *)`, `Bash(npm i *)`, `Bash(npm uninstall *)`) |
| Install an icon library (lucide, fontawesome, react-icons); use inline SVG | ⚠️ advisory only (`CLAUDE.md`/`AGENTS.md`); the `npm install` ask rule only prompts, it does not name libraries |
| Edit files outside the task's stated scope | ⚠️ advisory only (`AGENTS.md`: "Never edit files outside the stated scope") |

## 3. Never (hard-blocked)

| Action | Enforcer |
| --- | --- |
| Read `.env`, `.env.*` (any depth) | ✅ `permissions.deny`: `Read(.env)`, `Read(.env.*)`, `Read(**/.env)`, `Read(**/.env.*)` |
| Read `.env*` through the shell (`cat`/`head`/`tail`/`less`/`grep`) | ✅ `permissions.deny`: `Bash(cat .env*)`, `Bash(cat **/.env*)`, `Bash(head .env*)`, `Bash(tail .env*)`, `Bash(less .env*)`, `Bash(grep * .env*)`. Pattern-based: other spellings (`cat < .env`, `sed`, `awk`) are not covered |
| `rm -r` / `rm -rf` / `rm -R` / `--recursive` | ✅ `shell-guard.sh` (PreToolUse on Bash, exit 2) |
| `npm`/`pnpm`/`yarn … publish` | ✅ `shell-guard.sh` |
| `git push --force`, `-f`, `--force-with-lease`, `+refspec` | ✅ `shell-guard.sh` (also hits the `git push` ask rule) |
| Write/edit `.env`, `.env.*` | ⏸️ `guard-writes.mjs` (PreToolUse on Edit/Write/MultiEdit; **parked, not running**). Read is blocked, write is not |
| Write/edit `.claude/settings.json` | ⏸️ `guard-writes.mjs` (**parked**). Today anything can change the permissions |
| Write/edit build output `dist/` | ⏸️ `guard-writes.mjs` (**parked**) |
| Finish a turn while `npm run check` is red | ⏸️ `stop-gate.mjs` (Stop hook; **parked**). Until it is enabled, this is ⚠️ advisory only |
| Commit with failing types or lint (`npm run build` and `npm run lint` must pass) | ⚠️ advisory only (`AGENTS.md`, `.claude/rules/verification-gates.md`); the parked `stop-gate.mjs` would cover it for turn end, nothing blocks `git commit` itself |
| Add a backend or call external services; the app makes no network requests | `scripts/check-readonly.mjs` and `architecture.test.ts` (run by `npm run check`) catch `fetch`, `innerHTML` and similar in the app. Not a hook: they report, they do not block the agent |
| Write, rename or delete the user's files (app is read-only) | `scripts/check-readonly.mjs` (part of `npm run lint`). Reports at check time, does not block the tool call |
| Edit, weaken or bypass `scripts/check-readonly.mjs` | ⚠️ advisory only (`.claude/rules/verification-gates.md`) |
| Break tree accessibility (`role="tree"`, `treeitem`, `aria-*`, roving tabindex) | ⚠️ advisory only (`AGENTS.md`); component tests may catch some regressions, nothing is a dedicated gate |

## 4. Stop and report (escalation)

Stop, say what blocked you, and wait for the human. Do not retry the same blocked call or work around it.

| Condition | Enforcer |
| --- | --- |
| A hook or `permissions.deny` rule blocks a call (e.g. `shell-guard.sh` exit 2) | ⚠️ advisory only: the harness shows the denial; "do not bypass" is a convention, not a check |
| Repeated blocked attempts on the same action | ⚠️ advisory only: nothing counts attempts |
| `npm run check` still red after a fix attempt, or the failure is unfixable (flaky or out of scope) | ⏸️ `stop-gate.mjs` re-checks and blocks once; on the retry it lets the turn end (`stop_hook_active`, loop protection). **Parked.** Reporting is advisory only |
| An `ask` rule is declined (`git push`, `npm install`) | ✅ prompt from `permissions.ask`; carrying on without it is advisory only |

## Gaps to decide (flagged, not yet enforced)

1. **`guard-writes.mjs` and `stop-gate.mjs` are parked.** The `.env` write, `settings.json` write, `dist/` write and "red check" rows are not enforced until they move from `_disabled_hooks` to `hooks` in `settings.json`.
2. `audit-log.mjs` (JSONL trail in `logs/agent-audit.jsonl`) is built but not wired, so no action is currently logged.
3. `Bash(...)` deny rules match text patterns only; add more spellings or rely on `Read(...)` for tool-level blocks.
4. No rule stops `git commit` with failing gates, installs of icon libraries, out-of-scope edits, or accessibility breakage (all advisory).
