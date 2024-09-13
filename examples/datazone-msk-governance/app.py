#!/usr/bin/env python3
import os

import aws_cdk as cdk

from stacks.central_stack import CentralStack
from stacks.producer_stack import ProducerStack
from stacks.consumer_stack import ConsumerStack


app = cdk.App()
CentralStack(app, 
             "CentralStack", 
             env=cdk.Environment(account=os.getenv('CENTRAL_ACCOUNT'), region=os.getenv('CDK_DEFAULT_REGION')))

producer_stack = ProducerStack(app, 
                               "ProducerStack",
                               env=cdk.Environment(account=os.getenv('PRODUCER_ACCOUNT'), region=os.getenv('CDK_DEFAULT_REGION')))

ConsumerStack(app,
              "ConsumerStack",
              msk_vpc=producer_stack.msk_vpc,
              msk_security_group=producer_stack.msk_security_group,
              env=cdk.Environment(account=os.getenv('CONSUMER_ACCOUNT'), region=os.getenv('CDK_DEFAULT_REGION')))

app.synth()
