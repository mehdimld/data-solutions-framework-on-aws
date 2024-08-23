import { RemovalPolicy } from 'aws-cdk-lib';
import { DataZoneCustomAssetTypeFactory } from './datazone-custom-asset-type-factory';

export interface DataZoneKinesisAssetTypeProps {
  readonly domainId: string;
  readonly projectId: string;
  readonly dzCustomAssetTypeFactory?: DataZoneCustomAssetTypeFactory;
  readonly removalPolicy?: RemovalPolicy;
}