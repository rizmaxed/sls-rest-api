import { DynamoDBClient, DeleteItemCommand, DynamoDBServiceException } from "@aws-sdk/client-dynamodb";
import { getResponseHeaders, logger } from './util';

const dynamodb = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const tableName = process.env.CONTACTS_TABLE;

export const handler = async (event: any, context: any) => {
    logger.addContext(context);
    logger.info('delete-contact invoked', { httpMethod: event.httpMethod, path: event.path });

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

        await dynamodb.send(new DeleteItemCommand({
            TableName: tableName,
            Key: { contact_id: { S: contactId } },
            ConditionExpression: 'attribute_exists(contact_id)',
        }));

        logger.info('Contact deleted', { contactId });

        return {
            statusCode: 200,
            headers: getResponseHeaders(),
            body: JSON.stringify({ message: 'Contact deleted', contact_id: contactId })
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
