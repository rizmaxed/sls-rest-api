# sls-rest-api — Claude Code Instructions

Serverless contacts REST API built with AWS CDK, Lambda, DynamoDB, and API Gateway. CDK manages all infrastructure. Lambda handlers are TypeScript source files bundled automatically by esbuild via `NodejsFunction`.

## Architecture

```text
API Gateway (REST, stage: test)
  -> Lambda (NodejsFunction, Node.js 18.x, esbuild bundled)
  -> DynamoDB (contactsTable, partition key: contact_id STRING)
```

CDK stack: `lib/sls-rest-api-stack.ts`
CDK entry: `bin/sls-rest-api.ts`
Lambda handlers: `lambda/`
Shared utilities: `lambda/util.ts`

## API Endpoints

| Method | Path            | Handler              | Status      |
|--------|-----------------|----------------------|-------------|
| POST   | /contact        | add-contact.ts       | Implemented |
| GET    | /contact/id     | get-contact.ts       | Stub        |
| PATCH  | /contact/id     | update-contact.ts    | Stub        |
| DELETE | /contact/id     | delete-contact.ts    | Stub        |

## Commands

```bash
npm run build       # Type-check only (noEmit — no JS files produced)
npm test            # Run Jest tests
npm run cdk:deploy  # Deploy stack to AWS
npx cdk diff        # Show changes vs deployed stack
npx cdk synth       # Generate CloudFormation template (dry run)
npx cdk destroy     # Tear down stack (requires explicit confirmation)
```

## CDK Patterns

- Always use `NodejsFunction` — esbuild bundles the `.ts` entry automatically. Never use `Function` with `Code.fromAsset`.
- `entry:` must point to the `.ts` source file (e.g. `lambda/add-contact.ts`), not a compiled `.js`.
- CDK executes via `ts-node` — `npm run build` only type-checks; never rely on emitted `.js` output.
- Pass runtime config via `environment:` in the CDK construct, not hardcoded in Lambda source.
- Set `timeout` on every `NodejsFunction`.
- IAM: use `addToRolePolicy` with specific `actions` and `resources`. No wildcard `*` resources.

## Lambda Patterns

- Export a single `handler` async function per file.
- Use `getResponseHeaders()` from `lambda/util.ts` in every response — never inline the header object.
- `process.env.CONTACTS_TABLE` is always set by CDK. Use it; never hardcode a table name.
- Use `process.env.CDK_DEFAULT_REGION || 'us-east-2'` for the region.
- Instantiate `DynamoDBClient` at module scope (outside the handler) for connection reuse.
- Error handling: catch `DynamoDBServiceException` explicitly before the generic catch. Return `statusCode: 500` with a JSON body for all errors.
- Use `uuid` (v4) for ID generation: `import { v4 as uuid } from 'uuid'`.

## Quality Bar

Before considering any change done:
- `npm run build` passes with no TypeScript errors.
- `npm test` passes.
- `npx cdk synth` completes cleanly.
- No hardcoded AWS credentials, account IDs, or table names in source.
- CORS headers (`getResponseHeaders()`) present on every Lambda response.
- IAM policies use specific resource ARNs (not `*`).

## Operating Instructions

1. Before editing Lambda or CDK code, read the relevant rule under `.claude/rules/`.
2. After edits, run `npm run build` to type-check.
3. After Lambda changes, run `npm test`.
4. Before deploying, run `npx cdk diff` to review changes.
5. Never run `cdk destroy` without explicit user confirmation.
6. Never use `git add .` — stage files explicitly.

## Helpful Agents

- `cdk-reviewer` — CDK stack best practices review
- `lambda-reviewer` — Lambda handler patterns and error handling review
- `security-reviewer` — IAM, CORS, secrets, and dependency audit

## Safety Hooks

Hooks are configured in `.claude/settings.json`. They protect against:
- `rm -rf` on source directories
- Staging secret files via `git add .`
- Destructive AWS/CDK commands running without confirmation
- Missing validation after edits
