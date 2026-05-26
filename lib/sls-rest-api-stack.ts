import { Stack, StackProps, Duration, RemovalPolicy } from 'aws-cdk-lib';
import { Cors, LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { AttributeType, Table } from 'aws-cdk-lib/aws-dynamodb';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';

interface SlsRestApiStackProps extends StackProps {
  
}

export class SlsRestApiStack extends Stack {
  private restApi: RestApi;
  private getContact: NodejsFunction;
  private addContact: NodejsFunction;
  private updateContact: NodejsFunction;
  private deleteContact: NodejsFunction;
  private contactsTable: Table;

  constructor(scope: Construct, id: string, props?: SlsRestApiStackProps) {
    super(scope, id, props);

    this.contactsTable = new Table(this, 'contactsTable', {
      partitionKey: {name: 'contact_id', type: AttributeType.STRING},
      removalPolicy: RemovalPolicy.DESTROY
    });

    const policyStatementDynamoDB = new PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
      ],
      resources: [this.contactsTable.tableArn],
    });

    const environment = {
      CONTACTS_TABLE: this.contactsTable.tableName,
    }


    this.getContact = new NodejsFunction(this, 'getContact', {
      entry: 'lambda/get-contact.ts',
      timeout: Duration.seconds(10),
      runtime: Runtime.NODEJS_22_X,
      environment: environment,
    });

    this.addContact = new NodejsFunction(this, 'addContact', {
      entry: 'lambda/add-contact.ts',
      timeout: Duration.seconds(10),
      runtime: Runtime.NODEJS_22_X,
      environment: environment,
    });

    this.updateContact = new NodejsFunction(this, 'updateContact', {
      entry: 'lambda/update-contact.ts',
      timeout: Duration.seconds(10),
      runtime: Runtime.NODEJS_22_X,
      environment: environment,
    });

    this.deleteContact = new NodejsFunction(this, 'deleteContact', {
      entry: 'lambda/delete-contact.ts',
      timeout: Duration.seconds(10),
      runtime: Runtime.NODEJS_22_X,
      environment: environment,
    });

    this.getContact.addToRolePolicy(policyStatementDynamoDB);
    this.addContact.addToRolePolicy(policyStatementDynamoDB);
    this.updateContact.addToRolePolicy(policyStatementDynamoDB);
    this.deleteContact.addToRolePolicy(policyStatementDynamoDB);

    this.restApi = new RestApi(this, 'slsContacts', {
      restApiName: 'slsContacts',
      deployOptions: {
        stageName: "test"
      },
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS,
        allowMethods: Cors.ALL_METHODS,
      }
    });

    const contact = this.restApi.root.addResource("contact");
    contact.addMethod('POST', new LambdaIntegration(this.addContact));

    const byId = contact.addResource("{id}");
    byId.addMethod('GET', new LambdaIntegration(this.getContact));  
    byId.addMethod('PATCH', new LambdaIntegration(this.updateContact));
    byId.addMethod('DELETE', new LambdaIntegration(this.deleteContact));
  }
}
