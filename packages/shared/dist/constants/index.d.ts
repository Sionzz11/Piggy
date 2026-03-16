/**
 * Piggy Sentinel — shared constants
 */
export declare const CHAIN_ID_TESTNET = 11142220;
export declare const CHAIN_ID_MAINNET = 42220;
export declare const MIN_GOAL_AMOUNT_TESTNET = 20;
export declare const MIN_GOAL_AMOUNT_MAINNET = 100;
export declare const MIN_AAVE_SUPPLY_AMOUNT = 10;
export declare const MIN_REBALANCE_AMOUNT = 20;
export declare const ALLOC_USDT_BPS = 6000;
export declare const ALLOC_USDC_BPS = 3000;
export declare const ALLOC_USDM_BPS = 1000;
export declare const BLENDED_APY_PCT = 6.5;
export declare const MAX_LP_ALLOCATION_BPS = 3000;
export declare const MAX_VOLATILE_ALLOC_BPS = 4000;
export declare const IL_STOP_LOSS_BPS = 500;
export declare const MAX_REBALANCE_INTERVAL_MS: number;
export declare const MAX_SLIPPAGE_BPS = 100;
export declare const APY_CHANGE_THRESHOLD_PCT = 2;
export declare const MAX_ALLOCATION_SHIFT_BPS = 2000;
export declare const MAX_GAS_TO_YIELD_RATIO_PCT = 10;
export declare const PERFORMANCE_FEE_BPS = 500;
export declare const CHAT_FEE_USDC = "0.01";
export declare const FREE_CHAT_LIMIT_PER_MONTH = 10;
export declare const AGENT_CYCLE_INTERVAL_MS: number;
export declare const MILESTONE_THRESHOLDS_PCT: readonly [25, 50, 75, 100];
export declare const TELEGRAM_LINK_CODE_TTL_MS: number;
export declare const FEE_CURRENCY_SYMBOL = "CELO";
export declare const STABLE_ASSETS: readonly ["USDm", "USDT", "USDC"];
export declare const VOLATILE_ASSETS: readonly ["wETH"];
export declare const WHITELISTED_ASSETS: readonly ["USDm", "USDT", "USDC", "wETH"];
export type WhitelistedAsset = typeof WHITELISTED_ASSETS[number];
export type RiskProfile = "conservative" | "moderate" | "aggressive";
export declare const RISK_PROFILES: Record<RiskProfile, {
    aavePct: number;
    lpPct: number;
    wethPct: number;
    label: string;
}>;
export declare const MAX_TX_RETRIES = 3;
export declare const TX_RETRY_DELAYS_MS: number[];
export declare const HARDCODED_STRATEGY: {
    readonly expectedApyMin: 5.5;
    readonly expectedApyMax: 9.5;
    readonly fxHedgeThresholdPct: 3;
    readonly monitorCadenceHours: 6;
    readonly confidenceScore: 0.85;
};
//# sourceMappingURL=index.d.ts.map