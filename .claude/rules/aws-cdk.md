# Rule: AWS CDK

## Lambda Functions

- Always use `NodejsFunction` from `aws-cdk-lib/aws-lambda-nodejs` — esbuild handles TypeScript bundling automatically.
- Never use `Function` with `Code.fromAsset` for TypeScript handlers.
- `entry:` must point to the `.ts` source file (e.g. `lambda/add-contact.ts`).
- Set `timeout` on every function. Default Lambda timeout (3s) is too short for DynamoDB calls.
- Pass all runtime config via `environment:` on the construct — never hardcode in Lambda source.

## Build and Execution

- CDK executes via `npx ts-node --prefer-ts-exts` (see `cdk.json`). Do not manually compile before deploying.
- `npm run build` runs `tsc --noEmit` — type-check only. No `.js` output is produced or needed.
- Never commit compiled `.js` or `.d.ts` files — they are excluded by `.gitignore`.

## IAM

- Use `addToRolePolicy` with a `PolicyStatement` that names specific `actions` and `resources`.
- Resource ARNs must be specific (e.g. `this.contactsTable.tableArn`). Wildcards must be justified.

## DynamoDB

- `removalPolicy: RemovalPolicy.DESTROY` is intentional for this dev environment.
- Changing `removalPolicy` to `RETAIN` in production requires a CDK diff review first.

## Deployments

- Run `npx cdk diff` before every deploy to review changes.
- Run `npx cdk synth` to validate the CloudFormation template without deploying.
- Never run `cdk destroy` without explicit user confirmation.
