/**
 * allocationOptimizer
 *
 * Dynamically computes the optimal allocation percentages for the three
 * Piggy stablecoins (USDm, USDC, USDT) based on live Aave APYs.
 *
 * Strategy:
 *   Base: USDT 60%, USDC 30%, USDm 10% (matches the static default).
 *   When live APYs differ significantly from historical baseline, the
 *   optimizer shifts weight towards higher-yield assets subject to:
 *     - Min allocation per asset (prevents complete zero-out)
 *     - Max allocation per asset (prevents over-concentration)
 *     - User policy constraints (if provided)
 *
 * Algorithm: proportional APY weighting with clamping.
 *   weight_i = APY_i / sum(APY_j)
 *   allocation_i = clamp(weight_i, MIN_ALLOC, MAX_ALLOC)
 *   Then re-normalize so sum = 100%.
 *
 * Env overrides:
 *   ALLOC_MIN_PCT  (default 5)   — no asset goes below 5%
 *   ALLOC_MAX_PCT  (default 75)  — no asset exceeds 75%
 */
export interface ApyMap {
    usdm: number;
    usdc: number;
    usdt: number;
}
export interface AllocationMap {
    usdm: number;
    usdc: number;
    usdt: number;
}
export interface OptimizerResult {
    allocation: AllocationMap;
    /** Estimated blended APY after applying this allocation */
    blendedApy: number;
    /** Deviation from the static default (for logging) */
    driftFromDefault: AllocationMap;
    reason: string;
}
/**
 * Compute the optimal allocation for the three Piggy stablecoins.
 *
 * @example
 * const result = optimizeAllocation({ usdm: 1.07, usdc: 2.61, usdt: 8.89 });
 * // With these APYs the optimizer weights heavily towards USDT
 */
export declare function optimizeAllocation(apys: ApyMap, userConstraints?: Partial<AllocationMap>): OptimizerResult;
/** Convert bps allocation to a human-readable summary string */
export declare function formatAllocation(a: AllocationMap): string;
//# sourceMappingURL=allocationOptimizer.d.ts.map