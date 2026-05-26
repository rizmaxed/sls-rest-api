import { DynamoDBClient, UpdateItemCommand, DynamoDBServiceException } from "@aws-sdk/client-dynamodb";
import { getResponseHeaders } from './util';

const dynamodb = new DynamoDBClient({ region: process.env.CDK_DEFAULT_REGION || 'us-east-2' });
const tableName = process.env.CONTACTS_TABLE;

export const handler = async (event: any) => {
    try {
        const contactId = event.pathParameters?.id;
        if (!contactId) {
            return {
                statusCode: 400,
                headers: getResponseHeaders(),
                body: JSON.stringify({ error: 'Bad Request', message: 'Missing contact id' })
            };
        }

        const body = JSON.parse(event.body);
        const updates: Record<string, any> = { ...(body.Item || {}) };
        delete updates.contact_id;

        const updateKeys = Object.keys(updates);
        if (updateKeys.length === 0) {
            return {
                statusCode: 400,
                headers: getResponseHeaders(),
                body: JSON.stringify({ error: 'Bad Request', message: 'No fields to update' })
            };
        }

        const expressionAttributeNames: Record<string, string> = {};
        const expressionAttributeValues: Record<string, any> = {};
        const updateParts: string[] = [];

        updateKeys.forEach((key, i) => {
            const nameKey = `#attr${i}`;
            const valueKey = `:val${i}`;
            expressionAttributeNames[nameKey] = key;
            expressionAttributeValues[valueKey] = updates[key];
            updateParts.push(`${nameKey} = ${valueKey}`);
        });

        await dynamodb.send(new UpdateItemCommand({
            TableName: tableName,
            Key: { contact_id: { S: contactId } },
            UpdateExpression: `SET ${updateParts.join(', ')}`,
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: expressionAttributeValues,
            ConditionExpression: 'attribute_exists(contact_id)',
        }));

        return {
            statusCode: 200,
            headers: getResponseHeaders(),
            body: JSON.stringify({ contact_id: contactId, ...updates })
        };
    } catch (error) {
        console.log("Error", error);
        let message = { error: "Exception", message: "Unknown error" };
        if (error instanceof DynamoDBServiceException) {
            message = { error: error.name, message: error.message };
        }
        return {
            statusCode: 500,
            headers: getResponseHeaders(),
            body: JSON.stringify(message)
        };
    }
};
