# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

FROM --platform=linux/amd64 public.ecr.aws/amazonlinux/amazonlinux:2023 AS base

RUN dnf install -y python3 && dnf update pip

ENV VIRTUAL_ENV=/opt/venv
RUN python3 -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

COPY . .

RUN python3 -m pip install venv-pack==0.2.0 && \
    python3 -m pip install . && \
    cp src/datazone_transport.py .venv/lib/python3.9/site-packages/openlineage/client/transport

RUN mkdir /venv-package && venv-pack -f -o /venv-package/pyspark-env.tar.gz && chmod ugo+r /venv-package/pyspark-env.tar.gz