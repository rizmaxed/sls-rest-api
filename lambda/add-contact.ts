import { DynamoDBClient, PutItemCommand, DynamoDBServiceException } from "@aws-sdk/client-dynamodb";
import { v4 as uuid } from 'uuid';
import { getResponseHeaders, logger } from './util';

const dynamodb = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const tableName = process.env.CONTACTS_TABLE;

export const handler = async (event: any, context: any) => {
    logger.addContext(context);
    logger.info('add-contact invoked', { httpMethod: event.httpMethod, path: event.path });

    try {
        let item = JSON.parse(event.body).Item;
        item.contact_id = uuid();

        await dynamodb.send(new PutItemCommand({
            TableName: tableName,
            Item: item
        }));

        logger.info('Contact created', { contactId: item.contact_id });

        return {
            statusCode: 200,
            headers: getResponseHeaders(),
            body: JSON.stringify(item)
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
}