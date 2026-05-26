#!/usr/bin/env bash
set -euo pipefail
INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')
[ -z "$COMMAND" ] && exit 0
if echo "$COMMAND" | grep -qE 'git\s+(add|commit)'; then
  if echo "$COMMAND" | grep -qE 'git\s+add\s+(-A|--all|\.(\s|$))'; then
    echo "BLOCKED: Avoid git add . because it can stage secrets. Add files explicitly."
    exit 2
  fi
  SECRET_FILE_PATTERNS=(
    '\.env($|\s|/)'
    '\.pem($|\s)'
    '\.key($|\s)'
    '\.p12($|\s)'
    '\.pfx($|\s)'
    'credentials\.json'
    'credentials\.yaml'
    '(^|\s)aws-credentials($|\s)'
    '\.aws/'
  )
  for pattern in "${SECRET_FILE_PATTERNS[@]}"; do
    if echo "$COMMAND" | grep -qiE "$pattern"; then
      echo "BLOCKED: Potential secret file detected in git command: ${pattern}"
      echo "Use .env.example with placeholders and keep real credentials local."
      exit 2
    fi
  done
fi
exit 0
