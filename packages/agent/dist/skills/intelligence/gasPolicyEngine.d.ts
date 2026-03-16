/**
 * gasPolicyEngine
 *
 * Prevents the agent from executing transactions during periods of
 * abnormally high gas prices, protecting users from inflated fees.
 *
 * CELO/USD source (production-hardened):
 *   Mento Broker getAmountOut(CELO_TOKEN, USDm, 1e18).
 *   Falls back to CELO_PRICE_USD env var only if Mento call fails.
 *   The previous static env-var-only approach is removed.
 *
 * Env overrides:
 *   MAX_GAS_PRICE_GWEI      (default 50)
 *   MAX_GAS_COST_USD        (default 0.50)
 *   CELO_PRICE_USD          (emergency fallback only, default 0.75)
 *   TYPICAL_REBALANCE_GAS   (default 300000)
 *   CELO_TOKEN_ADDRESS      (override GoldToken address if needed)
 */
export interface GasPolicyResult {
    allowed: boolean;
    gasPriceGwei: number;
    celoPriceUSD: number;
    estimatedGasUSD: number;
    /** True when celoPriceUSD came from env fallback, not the live oracle */
    celoPriceIsStale: boolean;
    reason: string;
}
/**
 * Fetch live CELO/USD price from Mento broker.
 * Query: how many USDm does 1 CELO buy?
 * Exported so gasPolicyEngine tests can mock it.
 */
export declare function fetchCeloPriceFromMento(): Promise<number | null>;
export declare function evaluateGasPolicy(): Promise<GasPolicyResult>;
//# sourceMappingURL=gasPolicyEngine.d.ts.map