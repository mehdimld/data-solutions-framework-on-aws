# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

import os
from pyspark.sql import SparkSession


spark = SparkSession \
    .builder \
    .appName("EmrConsumer") \
    .getOrCreate()

df = spark \
  .readStream \
  .format("kafka") \
  .option("kafka.bootstrap.servers", os.environ["KAFKA_SOURCE_BOOTSTRAP"]) \
  .option("subscribe", os.environ["KAFKA_SOURCE_TOPIC"]) \
  .load()

# TODO add business processing

# df.filter().groupBy()

df.writeStream \
  .format("kafka") \
  .option("kafka.bootstrap.servers", os.environ["KAFKA_TARGET_BOOTSTRAP"]) \
  .option("topic", os.environ["KAFKA_TARGET_TOPIC"]) \
  .start()