from aws_cdk import (
    # Duration,
    RemovalPolicy,
    Stack,
    # aws_sqs as sqs,
    aws_datazone as datazone,
)
from constructs import Construct
from cdklabs import aws_data_solutions_framework as dsf
import os

class CentralStack(Stack):

    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        dsf.governance.DataZoneMskAssetType(self, 
                                            "DataZoneMskAssetType",
                                            domain_id='dzd_bfo0zlhaxvdc13',
                                            removal_policy=RemovalPolicy.DESTROY)
        
        central_authorizer = dsf.governance.DataZoneMskCentralAuthorizer(self, 
                                                    'CentralAuthorizer',
                                                    domain_id='dzd_bfo0zlhaxvdc13',
                                                    removal_policy=RemovalPolicy.DESTROY)
        
        central_authorizer.register_account(os.getenv('PRODUCER_ACCOUNT'))
        central_authorizer.register_account(os.getenv('CONSUMER_ACCOUNT'))