# sls-rest-api

Serverless contacts REST API built with AWS CDK, Lambda, DynamoDB, and API Gateway.

## Architecture

```
API Gateway (REST, stage: test)
  POST   /contact        → add-contact (Lambda)
  GET    /contact/{id}   → get-contact (Lambda)
  PATCH  /contact/{id}   → update-contact (Lambda)
  DELETE /contact/{id}   → delete-contact (Lambda)
                ↓
          DynamoDB (contactsTable, partition key: contact_id)
```

All Lambda functions are TypeScript, bundled by esbuild via `NodejsFunction`. Infrastructure is defined in `lib/sls-rest-api-stack.ts`.

## Local development

### Prerequisites

- Node.js 20+
- AWS CLI configured with credentials for your target account

### Commands

```bash
npm install          # Install dependencies
npm run build        # Type-check (no output emitted)
npm test             # Run Jest tests
npx cdk diff         # Show changes vs deployed stack
npx cdk synth        # Generate CloudFormation template
npm run cdk:deploy   # Deploy stack to AWS
```

---

## CI/CD — GitHub Actions

The workflow at `.github/workflows/cdk-deploy.yml` runs on pull requests, pushes to `main`, and manual dispatch.

| Event           | Behaviour                                                    |
| --------------- | ------------------------------------------------------------ |
| Pull request    | Install → Test → CDK Diff (no deploy)                        |
| Push to `main`  | Install → Test → CDK Diff → **manual approval** → CDK Deploy |
| Manual dispatch | Install → Test → CDK Diff → **manual approval** → CDK Deploy |

### Required GitHub setup

Complete these steps once before the workflow can run successfully.

---

#### Step 1 — Create the `production` Environment

The deploy job is gated behind a GitHub Environment named `production`. Without required reviewers configured, the job will run immediately without waiting for approval.

1. Go to your repository on GitHub.
2. Click **Settings** → **Environments** → **New environment**.
3. Name it exactly: `production`
4. Click **Configure environment**.
5. Under **Deployment protection rules**, enable **Required reviewers**.
6. Add yourself or your team as required reviewers.
7. Click **Save protection rules**.

---

#### Step 2 — Add the AWS IAM role ARN as a secret

The workflow authenticates with AWS using OIDC (no long-lived access keys). It expects the IAM role ARN as a repository secret.

1. Go to **Settings** → **Secrets and variables** → **Actions**.
2. Click **New repository secret**.
3. Name: `AWS_ROLE_ARN`
4. Value: the ARN of your IAM role (e.g. `arn:aws:iam::123456789012:role/github-actions-deploy`)
5. Click **Add secret**.

> The IAM role must trust GitHub's OIDC provider. See Step 4 for the trust policy.

---

#### Step 3 — Add the AWS region as a variable

The region is not sensitive and is stored as a repository variable (not a secret).

1. Go to **Settings** → **Secrets and variables** → **Actions**.
2. Click the **Variables** tab.
3. Click **New repository variable**.
4. Name: `AWS_REGION`
5. Value: your target AWS region (e.g. `us-east-2`)
6. Click **Add variable**.

---

#### Step 4 — Configure the IAM role trust policy

The IAM role used by the workflow must trust GitHub Actions as an OIDC identity provider.

**Add the OIDC provider to your AWS account** (one-time per account):

1. Open the [IAM console](https://console.aws.amazon.com/iam/).
2. Go to **Identity providers** → **Add provider**.
3. Select **OpenID Connect**.
4. Provider URL: `https://token.actions.githubusercontent.com`
5. Audience: `sts.amazonaws.com`
6. Click **Add provider**.

**Trust policy for the IAM role:**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::YOUR_ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:YOUR_GITHUB_ORG/sls-rest-api:*"
        }
      }
    }
  ]
}
```

Replace `YOUR_ACCOUNT_ID` and `YOUR_GITHUB_ORG` with your values.

**Minimum IAM permissions for the role:**

The role needs enough permissions to run CDK diff and deploy. At minimum:

- `cloudformation:*` on the stack
- `s3:*` on the CDK assets bucket
- `iam:PassRole` for Lambda execution roles
- `lambda:*`, `dynamodb:*`, `apigateway:*` for the resources this stack manages
- `sts:AssumeRole` for CDK's deployment role pattern

For a dev environment, attaching `AdministratorAccess` is common. For production, scope permissions to the resources this stack manages.

---

#### Step 5 — Verify the setup

1. Open a pull request against `main`.
2. Confirm the **Test & CDK Diff** job runs and the CDK diff output appears in the logs.
3. Merge the PR to trigger the full pipeline.
4. Confirm the **CDK Deploy** job pauses and a reviewer receives an approval request.
5. Approve the deployment and confirm the deploy job completes successfully.
