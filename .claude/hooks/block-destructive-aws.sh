#!/usr/bin/env bash
set -euo pipefail
INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')
[ -z "$COMMAND" ] && exit 0
# Block cdk destroy — must never run without explicit user confirmation
if echo "$COMMAND" | grep -qE 'cdk\s+destroy'; then
  echo "BLOCKED: cdk destroy must not run automatically. Confirm with the user first."
  exit 2
fi
# Block direct CloudFormation stack deletion
if echo "$COMMAND" | grep -qE 'aws\s+cloudformation\s+delete-stack'; then
  echo "BLOCKED: aws cloudformation delete-stack is a destructive operation. Run manually if intended."
  exit 2
fi
# Warn on other AWS state-changing commands (soft block — exit 1 so user is prompted)
if echo "$COMMAND" | grep -qE 'aws\s+.*\s+(delete|terminate|stop|modify|update|put|create)'; then
  if ! echo "$COMMAND" | grep -qE 'aws\s+sso\s+login|aws\s+sts\s+get-caller-identity'; then
    echo "WARNING: This appears to be an AWS state-changing command. Confirm this is intentional."
    exit 1
  fi
fi
exit 0
