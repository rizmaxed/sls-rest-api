import { DynamoDBClient, GetItemCommand, DynamoDBServiceException } from "@aws-sdk/client-dynamodb";
import { getResponseHeaders, logger } from './util';

const dynamodb = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const tableName = process.env.CONTACTS_TABLE;

export const handler = async (event: any, context: any) => {
    logger.addContext(context);
    logger.info('get-contact invoked', { httpMethod: event.httpMethod, path: event.path });

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

        const result = await dynamodb.send(new GetItemCommand({
            TableName: tableName,
            Key: { contact_id: { S: contactId } }
        }));

        if (!result.Item) {
            logger.warn('Contact not found', { contactId });
            return {
                statusCode: 404,
                headers: getResponseHeaders(),
                body: JSON.stringify({ error: 'Not Found', message: 'Contact not found' })
            };
        }

        logger.info('Contact retrieved', { contactId });

        return {
            statusCode: 200,
            headers: getResponseHeaders(),
            body: JSON.stringify(result.Item)
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
