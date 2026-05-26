import { DynamoDBClient, PutItemCommand, DynamoDBServiceException } from "@aws-sdk/client-dynamodb";
import { v4 as uuid } from 'uuid';
import { getResponseHeaders } from './util';

const dynamodb = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const tableName = process.env.CONTACTS_TABLE;

export const handler = async (event: any) => {
    try {
        let item = JSON.parse(event.body).Item;
        item.contact_id = uuid();

        await dynamodb.send(new PutItemCommand({
            TableName: tableName,
            Item: item
        }))

        return {
            statusCode: 200,
            headers: getResponseHeaders(),
            body: JSON.stringify(item)
        };
    } catch(error) {
        console.log("Error", error);
        let message = {
            error: "Exception",
            message: "Unknown error"
        };

        if (error instanceof DynamoDBServiceException) {
            // Handle DynamoDBServiceException
            message = {
                error: error.name,
                message: error.message
            };
        }

        return {
            statusCode: 500,
            headers: getResponseHeaders(),
            body: JSON.stringify(message)
        };
        
    }
}