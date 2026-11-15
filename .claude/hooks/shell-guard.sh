#!/usr/bin/env bash
# PreToolUse guard for the Bash tool.
# Reads the hook JSON from stdin, inspects tool_input.command and blocks
# dangerous operations: recursive deletes, package publishing, force-pushes.
# Exit 2 + reason on stderr = blocked; exit 0 with no output = allowed.

set -u

input="$(cat)"
command="$(printf '%s' "$input" | jq -r '.tool_input.command // empty' 2>/dev/null)"

# Nothing to inspect (not a Bash call, or malformed input): allow.
[ -z "$command" ] && exit 0

block() {
  printf 'Blocked by shell-guard: %s\n' "$1" >&2
  exit 2
}

# Recursive delete: rm with -r/-R/--recursive, alone or combined (-rf, -fr, -Rf...).
if printf '%s' "$command" | grep -Eq '(^|[;&|(`[:space:]])rm[[:space:]]+([^;&|]*[[:space:]])?(-[a-zA-Z]*[rR][a-zA-Z]*|--recursive)([[:space:]]|$)'; then
  block "recursive delete (rm -r / rm -rf) is forbidden because it can irreversibly destroy files, and this project must never delete the user's files. Remove specific files by name instead (e.g. 'rm path/to/file'), or ask the user to run the deletion themselves."
fi

# Package publishing.
if printf '%s' "$command" | grep -Eq '(^|[;&|(`[:space:]])(npm|pnpm|yarn)[[:space:]]+([^;&|]*[[:space:]])?publish([[:space:]]|$)'; then
  block "package publishing (npm/pnpm/yarn publish) is forbidden because it pushes code to a public registry and cannot be undone. Use 'npm pack --dry-run' to inspect the package, and ask the user to publish manually."
fi

# Force-push: --force, --force-with-lease, -f, or a +refspec.
if printf '%s' "$command" | grep -Eq '(^|[;&|(`[:space:]])git[[:space:]]+([^;&|]*[[:space:]])?push([[:space:]]+[^;&|]*)?[[:space:]](--force([=[:space:]-]|$)|-[a-zA-Z]*f[a-zA-Z]*([[:space:]]|$)|\+[^[:space:]]+)'; then
  block "force-pushing (git push --force / -f) is forbidden because it can overwrite remote history and destroy other people's commits. Use a regular 'git push', or rebase/merge locally and ask the user before rewriting remote history."
fi

exit 0
