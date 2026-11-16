# CONTRACT: what the agent may do here

Read this on day one. Every rule names what enforces it. Rules marked **advisory only** have no machine check: they rely on the agent and on review.

Config lives in `.claude/settings.json`; hook scripts in `.claude/hooks/` (fixtures in `.claude/hooks/samples/`).

**Status key**: ✅ active now (enforced by a hook or permission rule) · 🧪 a check that reports when run, not a blocking hook · ⚠️ advisory only.

Audit: `audit-log.mjs` (PostToolUse on Edit/Write/MultiEdit/Bash, and Stop) appends one scrubbed line per event to `logs/agent-audit.jsonl` (gitignored).

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
| Write/edit `.env`, `.env.*` | ✅ `guard-writes.mjs` (PreToolUse on Edit/Write/MultiEdit, denies via JSON) |
| Write/edit `.claude/settings.json` | ✅ `guard-writes.mjs`. To change settings, a human edits it or temporarily disables the hook |
| Write/edit build output `dist/` | ✅ `guard-writes.mjs` (Edit/Write only; `npm run build` itself still writes `dist/`) |
| Finish a turn while `npm run check` is red | ✅ `stop-gate.mjs` (Stop hook runs `npm run check`, exit 2 blocks the stop) |
| Commit with failing types or lint (`npm run build` and `npm run lint` must pass) | ⚠️ advisory only (`AGENTS.md`, `.claude/rules/verification-gates.md`); `stop-gate.mjs` covers turn end, but nothing blocks `git commit` itself |
| Add a backend or call external services; the app makes no network requests | 🧪 `src/architecture.test.ts` (part of `npm test`) bans `fetch(` in `src/`. It does **not** detect other network APIs (XMLHttpRequest, WebSocket, axios, `sendBeacon`), so this is partial. Blocks the turn end only via `stop-gate.mjs` |
| Write, rename or delete the user's files (app is read-only) | 🧪 `scripts/check-readonly.mjs` (part of `npm run lint`) fails on `createWritable`, `removeEntry`, `.move(`, `readwrite`, `FileSystemWritableFileStream` in `src/`, and on file-system handle types outside `src/services/fs.ts`. It is a text match on `src/`: it does not block the tool call itself |
| Edit, weaken or bypass `scripts/check-readonly.mjs` | ⚠️ advisory only (`.claude/rules/verification-gates.md`) |
| Break tree accessibility (`role="tree"`, `treeitem`, `aria-*`, roving tabindex) | ⚠️ advisory only (`AGENTS.md`); component tests may catch some regressions, nothing is a dedicated gate |

## 4. Stop and report (escalation)

Stop, say what blocked you, and wait for the human. Do not retry the same blocked call or work around it.

| Condition | Enforcer |
| --- | --- |
| A hook or `permissions.deny` rule blocks a call (e.g. `shell-guard.sh` exit 2) | ⚠️ advisory only: the harness shows the denial; "do not bypass" is a convention, not a check |
| Repeated blocked attempts on the same action | ⚠️ advisory only: nothing counts attempts |
| `npm run check` still red after a fix attempt, or the failure is unfixable (flaky or out of scope) | ✅ `stop-gate.mjs` blocks the stop when check is red; on the retry it lets the turn end (`stop_hook_active`, loop protection). Reporting the failure is advisory only |
| An `ask` rule is declined (`git push`, `npm install`) | ✅ prompt from `permissions.ask`; carrying on without it is advisory only |

## Gaps to decide (advisory only, not enforced)

1. Icon-library installs, out-of-scope edits, `git commit` with failing gates, editing `scripts/check-readonly.mjs`, and accessibility regressions have no hook or rule.
2. `Bash(...)` deny rules match text patterns only (`sed`, `awk`, `cat < .env` are not covered).
3. Network and write bans are 🧪 text checks: `fetch(` only, and a fixed list of File System Access write APIs. Other network APIs would pass.
4. Nothing counts repeated blocked attempts; "stop and report" is a convention.
5. `guard-writes.mjs` covers Edit/Write/MultiEdit only; shell redirects (`echo x > .env`) are not blocked by it.
