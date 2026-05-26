import { DynamoDBClient, DeleteItemCommand, DynamoDBServiceException } from "@aws-sdk/client-dynamodb";
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

        await dynamodb.send(new DeleteItemCommand({
            TableName: tableName,
            Key: { contact_id: { S: contactId } },
            ConditionExpression: 'attribute_exists(contact_id)',
        }));

        return {
            statusCode: 200,
            headers: getResponseHeaders(),
            body: JSON.stringify({ message: 'Contact deleted', contact_id: contactId })
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
