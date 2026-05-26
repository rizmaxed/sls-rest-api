# Rule: Lambda Handlers

## Client Instantiation

Instantiate `DynamoDBClient` at module scope — outside the handler function. This reuses the connection across warm invocations.

```ts
const dynamodb = new DynamoDBClient({ region: process.env.CDK_DEFAULT_REGION || 'us-east-2' });
```

Never create the client inside the handler.

## Response Format

Every response — success and error — must include:
- A `statusCode` (number)
- `headers` from `getResponseHeaders()` imported from `./util`
- A `body` that is `JSON.stringify(...)` of an object

Do not inline `{ 'Access-Control-Allow-Origin': '*' }`. Always use the util.

## Error Handling

Structure every handler with:
```ts
try {
  // happy path
} catch (error) {
  if (error instanceof DynamoDBServiceException) {
    // return 500 with error.name and error.message
  }
  // generic fallback
}
```

`DynamoDBServiceException` must be caught explicitly before the generic catch.

## Environment Variables

- Table name: `process.env.CONTACTS_TABLE` (set by CDK, always present at runtime)
- Region: `process.env.CDK_DEFAULT_REGION || 'us-east-2'`
- If `CONTACTS_TABLE` is missing, the Lambda will fail at DynamoDB call time — treat it as a deployment misconfiguration

## ID Generation

Use `uuid` v4:
```ts
import { v4 as uuid } from 'uuid';
const id = uuid();
```

The `uuidv4` package is deprecated — do not use it.

## Input Validation

Wrap `JSON.parse(event.body)` in a try/catch. Validate required fields before making DynamoDB calls. Return `statusCode: 400` with a descriptive message for invalid input.
