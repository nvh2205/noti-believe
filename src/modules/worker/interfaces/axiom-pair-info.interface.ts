export interface DynamicFee {
  initialized: number;
  filter_period: number;
  reduction_factor: number;
  bin_step_u128: string;
  bin_step: number;
  variable_fee_control: number;
  max_volatility_accumulator: number;
  decay_period: number;
}

export interface BaseFee {
  number_of_period: number;
  reduction_factor: string;
  cliff_fee_numerator: string;
  period_frequency: string;
  fee_scheduler_mode: number;
}

export interface PoolFees {
  dynamic_fee: DynamicFee;
  referral_fee_percent: number;
  base_fee: BaseFee;
  protocol_fee_percent: number;
}

export interface LockedVestingConfig {
  number_of_period: string;
  amount_per_period: string;
  cliff_duration_from_migration_time: string;
  frequency: string;
  cliff_unlock_amount: string;
}

export interface CurvePoint {
  sqrt_price: string;
  liquidity: string;
}

export interface ProtocolDetails {
  token_program: string;
  migration_base_threshold: string;
  migration_quote_threshold: string;
  quote_mint: string;
  partner_locked_lp_percentage: number;
  creator_lp_percentage: number;
  migration_fee_option: number;
  partner_lp_percentage: number;
  swap_base_amount: string;
  creator_locked_lp_percentage: number;
  pre_migration_token_supply: string;
  activation_type: number;
  collect_fee_mode: number;
  fixed_token_supply_flag: number;
  fee_claimer: string;
  quote_vault: string;
  pool_fees: PoolFees;
  locked_vesting_config: LockedVestingConfig;
  base_vault: string;
  migration_option: number;
  token_type: number;
  owner: string;
  created_at: number;
  curve: CurvePoint[];
  deployer_address: string;
  config_address: string;
  version: number;
  post_migration_token_supply: string;
  quote_token_flag: number;
  token_decimal: number;
  migration_sqrt_price: string;
  sqrt_start_price: string;
}

export interface AxiomPairInfo {
  top10Holders: number;
  dexPaid: boolean;
  protocol: string;
  twitter: string | null;
  tokenTicker: string;
  protocolDetails: ProtocolDetails;
  pairAddress: string;
  deployerAddress: string;
  supply: number;
  signature: string;
  discord: string | null;
  updatedAt: string;
  pairTokenAccount: string;
  tokenImage: string | null;
  telegram: string | null;
  tokenAddress: string;
  initialLiquidityToken: number;
  slot: number;
  extra: any | null;
  initialLiquiditySol: number;
  openTrading: string;
  tokenName: string;
  freezeAuthority: string | null;
  lpBurned: number;
  pairSolAccount: string;
  tokenDecimals: number;
  tokenUri: string;
  createdAt: string;
  mintAuthority: string | null;
  website: string | null;
  isWatchlisted: boolean;
  twitterHandleHistory: string[];
} 