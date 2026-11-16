#!/usr/bin/env bash
# Headless, read-only audit of a target path against CLAUDE.md and CONTRACT.md.
# Usage: scripts/spine-audit.sh [target-path]   (default: src)
# Safety rails: read-only tools, 10-turn cap, $1.50 cap, JSON output.
# Project hooks are disabled for this run: the audit cannot edit anything, and the
# Stop hook (npm run check) otherwise hijacks the result and burns extra turns.
set -euo pipefail

TARGET="${1:-src}"

cd "$(dirname "${BASH_SOURCE[0]}")/.."

PROMPT="Audit the path '${TARGET}' against the rules in CLAUDE.md, AGENTS.md and CONTRACT.md. \
Read those files, then inspect the target with Read/Grep/Glob only. \
Report each violation as file:line plus the rule it breaks, or state that none were found. \
Do not modify anything. Keep the report concise."

claude -p "$PROMPT" \
  --tools "Read,Grep,Glob" \
  --max-turns 10 \
  --max-budget-usd 1.50 \
  --output-format json \
  --no-session-persistence \
  --settings '{"disableAllHooks": true}' \
  < /dev/null \
| jq '{is_error, num_turns, total_cost_usd, duration_ms, result}'
