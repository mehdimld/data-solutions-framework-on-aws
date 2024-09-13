from aws_cdk import (
    # Duration,
    Duration,
    RemovalPolicy,
    Stack,
    aws_s3 as s3,
    aws_datazone as datazone,
    aws_iam as iam,
    aws_ec2 as ec2,
    aws_glue as glue,
    aws_logs as logs,
)
from constructs import Construct
from cdklabs import aws_data_solutions_framework as dsf

class ProducerStack(Stack):

    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)
        
        producer_role = iam.Role(self, 'MsfProducerRole',
                                     assumed_by=iam.ServicePrincipal('kinesisanalytics.amazonaws.com'))

        msk_producer_cluster = dsf.streaming.MskProvisioned(self, "MskProvisioned",
                                     cluster_name='producer-cluster',
                                     ebs_storage=dsf.streaming.EbsStorageInfo(volume_size=20),
                                     kafka_version=dsf.streaming.KafkaVersion.V3_7_X_KRAFT,
                                     removal_policy=RemovalPolicy.DESTROY)
        
        msk_producer_cluster.set_topic('ProducerTopic',
                                       client_authentication=dsf.streaming.Authentication.IAM,
                                       topic_definition=dsf.streaming.MskTopic(
                                       num_partitions=1,
                                       topic='streaming-data-product'))
        
        msk_producer_cluster.grant_produce('ProducerGrant', 
                                           topic_name='streaming-data-product',
                                           client_authentication=dsf.streaming.Authentication.IAM,
                                           principal=producer_role,
                                           custom_resource_authentication=dsf.streaming.Authentication.IAM,
                                           removal_policy=RemovalPolicy.DESTROY)
        
        producer_security_group = ec2.SecurityGroup(self, 'ProducerSecurityGroup',
                                                    vpc=msk_producer_cluster.vpc,
                                                    allow_all_outbound=True)
        
        msk_producer_cluster.broker_security_group.add_ingress_rule(peer=producer_security_group,
                                                                    connection=ec2.Port.tcp(9098))
        
        producer_schema_registry = glue.CfnRegistry(self, 'ProducerRegistry', 
                                                    name='producer-registry')
        
        # permissions for glue schema registry

        # use assets to deploy code from a folder to S3

        # point the python app on the uploaded asset

        # if you need to build or package a wheel before uploading via CDK asset, we can use a docker file for this,
        #  it will be managed in the deploy
                
        dsf.governance.DataZoneMskEnvironmentAuthorizer(self, 
                                                        'EnvironmentAuthorizer',
                                                        domain_id='dzd_bfo0zlhaxvdc13',
                                                        central_account_id='762037063530')
        
        self.msk_vpc = msk_producer_cluster.vpc
        self.msk_security_group = msk_producer_cluster.broker_security_group