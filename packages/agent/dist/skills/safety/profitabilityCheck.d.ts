/**
 * profitabilityCheck
 *
 * Ensures every rebalance or migration action is economically rational:
 * the projected yield improvement over the holding period must exceed
 * the gas cost paid to execute the action.
 *
 * Formula:
 *   annualYieldGainUSD  = portfolioValueUSD × (newAPY − currentAPY) / 100
 *   holdingPeriodYield  = annualYieldGainUSD × (holdingDays / 365)
 *   profitable          = holdingPeriodYield > gasUSD × MIN_PROFIT_MULTIPLIER
 *
 * MIN_PROFIT_MULTIPLIER (default 2×): ensures we gain at least 2× gas cost
 * before moving funds — a conservative guard against micro-rebalances that
 * burn gas for negligible yield improvement.
 *
 * Env overrides:
 *   MIN_PROFIT_MULTIPLIER     (default 2.0)
 *   REBALANCE_HORIZON_DAYS    (default 30 — how far ahead to project gains)
 */
export interface ProfitabilityInput {
    /** Total portfolio value in USD currently deployed in this strategy */
    portfolioValueUSD: number;
    /** Current blended APY across all positions (e.g. 4.5 for 4.5%) */
    currentApyPct: number;
    /** Projected blended APY after the rebalance */
    newApyPct: number;
    /** Estimated gas cost for the full rebalance action in USD */
    estimatedGasUSD: number;
    /**
     * Days until goal deadline — used as the projection horizon.
     * Capped at REBALANCE_HORIZON_DAYS to prevent over-optimistic long-range projections.
     */
    deadlineDays: number;
}
export interface ProfitabilityResult {
    profitable: boolean;
    apyImprovementPct: number;
    projectedGainUSD: number;
    breakEvenDays: number;
    gasUSD: number;
    minRequiredGainUSD: number;
    reason: string;
}
/**
 * Determine whether a rebalance action is worth the gas cost.
 *
 * @example
 * const check = checkProfitability({
 *   portfolioValueUSD: 10_000,
 *   currentApyPct:     4.5,
 *   newApyPct:         8.9,
 *   estimatedGasUSD:   0.05,
 *   deadlineDays:      60,
 * });
 * if (!check.profitable) skip action;
 */
export declare function checkProfitability(input: ProfitabilityInput): ProfitabilityResult;
//# sourceMappingURL=profitabilityCheck.d.ts.map