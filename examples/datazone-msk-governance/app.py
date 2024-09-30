# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

import os

import aws_cdk as cdk

from stacks.streaming_governance_stack import StreamingGovernanceStack


app = cdk.App()
StreamingGovernanceStack(app, "StreamingGovernanceStack",
    domain_id=os.getenv('DOMAIN_ID')
    )

app.synth()
