// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Duration, RemovalPolicy, Stack } from 'aws-cdk-lib';
import { Effect, IRole, ISamlProvider, IUser, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { CfnDataLakeSettings, CfnPermissions, CfnResource } from 'aws-cdk-lib/aws-lakeformation';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { IBucket } from 'aws-cdk-lib/aws-s3';
import { AwsCustomResource, AwsCustomResourcePolicy, PhysicalResourceId } from 'aws-cdk-lib/custom-resources';
import { Construct } from 'constructs';
import { PermissionModel } from '../../utils';


/**
 * Grant Lake Formation admin role to a principal.
 * @param scope the construct scope
 * @param id the construct id
 * @param principal the IAM Principal to grant Lake Formation admin role. Can be an IAM User, an IAM Role or a SAML identity
 * @return the CfnDataLakeSettings to set the principal as Lake Formation admin
 */
export function grantLfAdminRole(scope: Construct, id: string, principal: IRole|IUser|[ISamlProvider, string]): CfnDataLakeSettings {

  // Check if the principal is an Amazon IAM Role or User and extract the arn and name
  let principalArn: string;
  if ((principal as IRole).roleArn) {
    principalArn = (principal as IRole).roleArn;
  } else if ((principal as IUser).userArn) {
    principalArn = (principal as IUser).userArn;
  } else {
    const samlIdentity = (principal as [ISamlProvider, string]) ;
    principalArn = samlIdentity[0].samlProviderArn + samlIdentity[1];
  }

  return new CfnDataLakeSettings(scope, id, {
    admins: [
      {
        dataLakePrincipalIdentifier: principalArn,
      },
    ],
    mutationType: 'APPEND',
    parameters: {
      CROSS_ACCOUNT_VERSION: 4,
    },
  });
}

/**
 * Register an Amazon S3 location in AWS Lake Formation.
 * It creates an IAM Role dedicated per location and register the location using either Lake Formation or Hybrid access model.
 * @param scope the construct scope
 * @param id the construct id
 * @param locationBucket the Amazon S3 location bucket
 * @param locationPrefix the Amazon S3 location prefix
 * @param accessMode the Amazon S3 location access model
 * @return the CfnDataLakeSettings to register the Amazon S3 location in AWS Lake Formation
 */
export function registerS3Location(
  scope: Construct,
  id: string,
  locationBucket: IBucket,
  locationPrefix: string,
  accessMode?: PermissionModel,
) : [IRole, CfnResource] {

  // create the IAM role for LF data access
  const lfDataAccessRole = new Role(scope, `${id}DataAccessRole`, {
    assumedBy: new ServicePrincipal('lakeformation.amazonaws.com'),
  });

  const grantRead = locationBucket.grantReadWrite(lfDataAccessRole, locationPrefix);

  const dataLakeLocation = new CfnResource(scope, `${id}DataLakeLocation`, {
    hybridAccessEnabled: accessMode === PermissionModel.HYBRID ? true : false,
    useServiceLinkedRole: false,
    roleArn: lfDataAccessRole.roleArn,
    resourceArn: locationBucket.arnForObjects(locationPrefix),
  });

  dataLakeLocation.node.addDependency(grantRead);

  return [lfDataAccessRole, dataLakeLocation];

}

/**
 * Remove the IAMAllowedPrincipal permission from the database.
 * @param scope the construct scope
 * @param id the construct id
 * @param database the database to remove the IAMAllowedPrincipal permission
 * @return the CfnDataLakeSettings to remove the IAMAllowedPrincipal permission
 */
export function removeIamAllowedPrincipal(scope: Construct, id: string, database: string, execRole: IRole, removalPolicy: RemovalPolicy): AwsCustomResource {

  const stack = Stack.of(scope);

  // eslint-disable-next-line local-rules/no-tokens-in-construct-id
  const cr = new AwsCustomResource(scope, id, {
    removalPolicy,
    role: execRole,
    onCreate: {
      service: 'LakeFormation',
      action: 'RevokePermissions',
      parameters: {
        Permissions: ['ALL'],
        Principal: {
          DataLakePrincipalIdentifier: 'IAM_ALLOWED_PRINCIPALS',
        },
        Resource: {
          Database: {
            Name: database,
          }
        }
      },
      physicalResourceId: PhysicalResourceId.of(`${database}`),
    },
    policy: AwsCustomResourcePolicy.fromStatements([
      new PolicyStatement({
        actions: ['lakeformation:RevokePermissions'],
        effect: Effect.ALLOW,
        resources: [
          `arn:${stack.partition}:lakeformation:${stack.region}:${stack.account}:catalog:${stack.account}`
        ]
      }),
      new PolicyStatement({
        actions: [
          'glue:GetDatabase',
          ],
        effect: Effect.ALLOW,
        resources: [
          `arn:${stack.partition}:glue:${stack.region}:${stack.account}:database/${database}`,
          `arn:${stack.partition}:glue:${stack.region}:${stack.account}:catalog`

      ]})
    ]),
    logRetention: RetentionDays.ONE_WEEK,
    timeout: Duration.seconds(60)
  });

  return cr;
}

/**
 * Grant Lake Formation access on Data Lake Location
 * @param scope the construct scope
 * @param id the construct id
 * @param location the Amazon S3 location in ARN format
 * @param principal the IAM Principal to grant Lake Formation access on Data Lake Location
 * @return the CfnPermissions to grant Lake Formation access on Data Lake Location
 */

export function grantDataLakeLocation(scope: Construct, id: string, location: string, principal: IRole): CfnPermissions {

  return new CfnPermissions(scope, id, {
    permissions: ['DATA_LOCATION_ACCESS'],
    permissionsWithGrantOption: [],
    dataLakePrincipal: {
      dataLakePrincipalIdentifier: principal.roleArn,
    },
    resource: {
      dataLocationResource: {
        catalogId: Stack.of(scope).account,
        s3Resource: location,
      },
    },
  });
}