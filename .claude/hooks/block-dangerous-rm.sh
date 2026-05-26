#!/usr/bin/env bash
set -euo pipefail
INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')
[ -z "$COMMAND" ] && exit 0
PROTECTED_DIRS="lambda bin lib test .claude"
if echo "$COMMAND" | grep -qE 'rm\s+(-[a-zA-Z]*[rf][a-zA-Z]*\s+|--recursive|--force)'; then
  for dir in $PROTECTED_DIRS; do
    if echo "$COMMAND" | grep -qE "rm\s+.*(\s|/|^)\.?/?${dir}(/|\s|$)"; then
      echo "BLOCKED: Cannot use rm -rf on protected directory: ${dir}/"
      echo "Delete specific files intentionally or use git checkout to restore."
      exit 2
    fi
  done
fi
exit 0
