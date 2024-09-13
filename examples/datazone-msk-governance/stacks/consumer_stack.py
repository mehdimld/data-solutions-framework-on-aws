from aws_cdk import (
    # Duration,
    RemovalPolicy,
    Stack,
    aws_ec2 as ec2,
    aws_datazone as datazone,
    aws_iam as iam,
)
from constructs import Construct
from cdklabs import aws_data_solutions_framework as dsf

class ConsumerStack(Stack):

    def __init__(self, scope: Construct, construct_id: str, msk_vpc: ec2.Vpc, msk_security_group: ec2.SecurityGroup, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        consumer_role = iam.Role(self, 'EmrConsumerRole', 
                                 assumed_by=iam.CompositePrincipal(
                                     iam.ServicePrincipal('emr.amazonaws.com')))
        
        consumer_security_group = ec2.SecurityGroup(self, 'ConsumerSecurityGroup', 
                                                    vpc=msk_vpc,
                                                    allow_all_outbound=True)
        
        consumer_security_group.add_egress_rule(msk_security_group, ec2.Port.tcp(9098), remote_rule=True)

        datazone.CfnSubscriptionTarget(self,'MskTopicsTarget',
                                       applicable_asset_types= ['MskTopicAssetType'],
                                       authorized_principals=[consumer_role.role_arn],
                                       domain_identifier='dzd_bfo0zlhaxvdc13',
                                       environment_identifier='42jxo43y9oj95z',
                                       manage_access_role='arn:aws:iam::448162928721:role/gromav',
                                       name='MskTopicsTarget',
                                       provider='dsf',
                                       subscription_target_config=[],
                                       type='BaseSubscriptionTargetType')