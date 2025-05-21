export interface AxiomTokenPrice {
  signature: string;
  pairAddress: string;
  type: 'buy' | 'sell';
  createdAt: string;
  liquiditySol: number;
  liquidityToken: number;
  makerAddress: string;
  priceSol: number;
  priceUsd: number;
  tokenAmount: number;
  totalSol: number;
  totalUsd: number;
  innerIndex: number | null;
  outerIndex: number;
} 