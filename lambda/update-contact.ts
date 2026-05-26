import { DynamoDBClient, UpdateItemCommand, DynamoDBServiceException } from "@aws-sdk/client-dynamodb";
import { getResponseHeaders, logger } from './util';

const dynamodb = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const tableName = process.env.CONTACTS_TABLE;

export const handler = async (event: any, context: any) => {
    logger.addContext(context);
    logger.info('update-contact invoked', { httpMethod: event.httpMethod, path: event.path });

    try {
        const contactId = event.pathParameters?.id;
        if (!contactId) {
            logger.warn('Missing contact id in request');
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
            logger.warn('No fields to update', { contactId });
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

        logger.info('Contact updated', { contactId });

        return {
            statusCode: 200,
            headers: getResponseHeaders(),
            body: JSON.stringify({ contact_id: contactId, ...updates })
        };
    } catch (error) {
        let message = { error: "Exception", message: "Unknown error" };
        if (error instanceof DynamoDBServiceException) {
            logger.error('DynamoDB error', { errorName: error.name, errorMessage: error.message });
            message = { error: error.name, message: error.message };
        } else {
            logger.error('Unhandled error', { error: String(error) });
        }
        return {
            statusCode: 500,
            headers: getResponseHeaders(),
            body: JSON.stringify(message)
        };
    }
};
