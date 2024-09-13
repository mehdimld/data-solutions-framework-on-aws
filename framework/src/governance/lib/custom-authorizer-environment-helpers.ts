// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Arn, Stack } from 'aws-cdk-lib';
import { Grant, Role } from 'aws-cdk-lib/aws-iam';
import { IFunction } from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

/**
 * The interface representing the environment custom authorizer workflow.
 */
export interface AuthorizerEnvironmentWorflow{
  /**
   * The state machine that orchestrates the workflow.
   */
  readonly lambdaInvokeGrant: Grant;
  /**
   * The event rule that triggers the workflow.
   */
  readonly assumeRoleGrant: Grant;
}

/**
 *
 * @param scope The scope of the resources created
 * @param authorizerName The name of the authorizer
 * @param grantFunction The lambda function creating the grants
 * @param centralAccount The central account ID hosting the central authorizer workflow
 * @param workflowTimeout The timeout for the authorizer workflow. @default - 5 minutes
 * @param retryAttempts The number of retry attempts for the authorizer workflow. @default - No retry
 * @param removalPolicy The removal policy for the created resources. @default - RemovalPolicy.RETAIN
 * @returns The created AuthorizerEnvironmentWorflow
 */
export function authorizerEnvironmentWorkflowSetup(
  scope: Construct,
  authorizerName: string,
  grantFunction: IFunction,
  centralAccount?: string) : AuthorizerEnvironmentWorflow {

    const centralAuthorizerRole = Role.fromRoleArn(scope, 'CentraRole', 
      Arn.format({
        account: centralAccount,
        resource: 'role',
        service: 'iam',
        resourceName: `${authorizerName}Role`
      }, Stack.of(scope)), {
        mutable: false,
        addGrantsToResources: true,
      }
    );
    if ( grantFunction.role === undefined ) {
      throw new Error('grantFunction.role is undefined');
    } else {
      const lambdaInvokeGrant = grantFunction.grantInvoke(centralAuthorizerRole);
      const assumeRoleGrant = grantFunction.role!.grantAssumeRole(centralAuthorizerRole);
      return { lambdaInvokeGrant, assumeRoleGrant }
    }
}