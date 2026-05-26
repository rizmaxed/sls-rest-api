#!/usr/bin/env bash
set -euo pipefail
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
[ -z "$FILE_PATH" ] && exit 0
if echo "$FILE_PATH" | grep -qE 'lambda/.*\.ts$'; then
  echo "Tip: Lambda handler changed. Run: npm run build && npm test"
fi
if echo "$FILE_PATH" | grep -qE 'lib/.*\.ts$'; then
  echo "Tip: CDK stack changed. Run: npm run build && npx cdk synth"
fi
if echo "$FILE_PATH" | grep -qE 'bin/.*\.ts$'; then
  echo "Tip: CDK entry changed. Run: npm run build && npx cdk synth"
fi
if echo "$FILE_PATH" | grep -qE 'test/.*\.ts$'; then
  echo "Tip: Tests changed. Run: npm test"
fi
if echo "$FILE_PATH" | grep -qE 'package\.json$'; then
  echo "Tip: package.json changed. Run: npm install && npm audit"
fi
exit 0
