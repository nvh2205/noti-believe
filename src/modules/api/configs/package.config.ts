import { PackageType } from '../enums/package.enum';

export interface PackageConfig {
  amount_nft: number;
  amount_turns: number;
  price_per_nft: number;
}

export const PACKAGE_CONFIG: Record<PackageType, PackageConfig> = {
  [PackageType.ONE_NFT]: {
    amount_nft: 1,
    amount_turns: 1,
    price_per_nft: 2,
  },
  [PackageType.TWENTY_NFT]: {
    amount_nft: 2,
    amount_turns: 25,
    price_per_nft: 2,
  },
  [PackageType.THIRTY_NFT]: {
    amount_nft: 30,
    amount_turns: 50,
    price_per_nft: 2,
  },
}; 