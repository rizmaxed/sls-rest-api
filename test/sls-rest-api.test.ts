import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { SlsRestApiStack } from '../lib/sls-rest-api-stack';

let template: Template;

beforeAll(() => {
    const app = new cdk.App({
        context: { 'aws:cdk:bundling-stacks': [] },
    });
    const stack = new SlsRestApiStack(app, 'TestStack');
    template = Template.fromStack(stack);
});

describe('DynamoDB', () => {
    test('contacts table has contact_id as partition key', () => {
        template.hasResourceProperties('AWS::DynamoDB::Table', {
            KeySchema: [{ AttributeName: 'contact_id', KeyType: 'HASH' }],
            AttributeDefinitions: [{ AttributeName: 'contact_id', AttributeType: 'S' }],
        });
    });

    test('contacts table has DESTROY removal policy', () => {
        template.hasResource('AWS::DynamoDB::Table', {
            DeletionPolicy: 'Delete',
            UpdateReplacePolicy: 'Delete',
        });
    });
});

describe('Lambda functions', () => {
    test('four lambda functions are created', () => {
        template.resourceCountIs('AWS::Lambda::Function', 4);
    });

    test('all functions use Node.js 22 runtime', () => {
        template.allResourcesProperties('AWS::Lambda::Function', {
            Runtime: 'nodejs22.x',
        });
    });

    test('all functions have a 10 second timeout', () => {
        template.allResourcesProperties('AWS::Lambda::Function', {
            Timeout: 10,
        });
    });

    test('all functions receive CONTACTS_TABLE env var', () => {
        template.allResourcesProperties('AWS::Lambda::Function', {
            Environment: {
                Variables: Match.objectLike({
                    CONTACTS_TABLE: Match.anyValue(),
                }),
            },
        });
    });
});

describe('IAM', () => {
    test('lambda roles have GetItem, PutItem, UpdateItem, DeleteItem on the contacts table', () => {
        template.hasResourceProperties('AWS::IAM::Policy', {
            PolicyDocument: {
                Statement: Match.arrayWith([
                    Match.objectLike({
                        Effect: 'Allow',
                        Action: Match.arrayWith([
                            'dynamodb:GetItem',
                            'dynamodb:PutItem',
                            'dynamodb:UpdateItem',
                            'dynamodb:DeleteItem',
                        ]),
                    }),
                ]),
            },
        });
    });
});

describe('API Gateway', () => {
    test('REST API is created', () => {
        template.resourceCountIs('AWS::ApiGateway::RestApi', 1);
    });

    test('API is deployed to test stage', () => {
        template.hasResourceProperties('AWS::ApiGateway::Stage', {
            StageName: 'test',
        });
    });

    test('POST /contact method exists', () => {
        template.hasResourceProperties('AWS::ApiGateway::Method', {
            HttpMethod: 'POST',
        });
    });

    test('GET, PATCH, DELETE methods exist', () => {
        template.hasResourceProperties('AWS::ApiGateway::Method', {
            HttpMethod: 'GET',
        });
        template.hasResourceProperties('AWS::ApiGateway::Method', {
            HttpMethod: 'PATCH',
        });
        template.hasResourceProperties('AWS::ApiGateway::Method', {
            HttpMethod: 'DELETE',
        });
    });
});
