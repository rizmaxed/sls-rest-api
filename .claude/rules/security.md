# Rule: Security

## Non-Negotiables

- No hardcoded AWS credentials, account IDs, or secret values in source files.
- IAM `actions` and `resources` must be specific — no `*` unless explicitly documented with justification.
- `cdk destroy` must never run automatically. Always confirm with the user first.
- Environment variables are the only permitted channel for runtime config (table name, region, etc.).

## CORS

`Access-Control-Allow-Origin: *` is intentional for this API. Do not change it without discussion. If this API ever handles authentication tokens, CORS must be restricted to specific origins.

## Secrets and Config

- Never hardcode DynamoDB table names — always use `process.env.CONTACTS_TABLE`.
- Never hardcode AWS region — use `process.env.CDK_DEFAULT_REGION || 'us-east-2'`.
- Do not add `.env` files. Use environment variables injected by CDK or the shell.

## Git Safety

- Never use `git add .` or `git add -A` — always add files explicitly.
- The `.gitignore` must exclude: `*.js`, `*.d.ts`, `cdk.out/`, `node_modules/`, `.env`, `.DS_Store`.
