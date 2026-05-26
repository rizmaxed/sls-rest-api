import { Logger } from '@aws-lambda-powertools/logger';

export const logger = new Logger({ serviceName: 'contacts-api' });

export function getResponseHeaders() {
    return {
        'Access-Control-Allow-Origin': '*'
    }
}