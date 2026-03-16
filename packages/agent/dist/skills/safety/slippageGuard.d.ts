/**
 * slippageGuard
 *
 * Prevents swaps and liquidity exits when price impact exceeds configurable thresholds.
 *
 * Design rationale:
 *   - Slippage is the silent value-drain in DeFi automation.
 *   - Autonomous agents are especially vulnerable because they cannot "feel"
 *     that the market is thin; they just submit the tx.
 *   - This guard runs before every swap/exit action and blocks execution if
 *     estimated slippage exceeds the configured maximum.
 *
 * Slippage estimation:
 *   We use a constant-product (xy=k) approximation for Uniswap pools.
 *   For Mento we use its flat-fee model (slippage ≈ fee + spread).
 *   For Aave supply/withdraw there is no slippage — we always allow.
 */
export type SwapProtocol = "uniswap" | "mento" | "aave";
export interface SlippageGuardInput {
    /** Protocol executing the swap */
    protocol: SwapProtocol;
    /** USD value being swapped / exited */
    tradeValueUSD: number;
    /**
     * Total pool TVL in USD (used for xy=k approximation).
     * Not required for Aave (no slippage) or Mento (flat fee).
     */
    poolTvlUSD?: number;
    /**
     * Mento spread / fee in percent (default 0.3%).
     * Only relevant when protocol = "mento".
     */
    mentoFeePct?: number;
    /**
     * Maximum acceptable slippage in percent.
     * Defaults: uniswap=1.0%, mento=0.5%, aave=0% (always passes).
     */
    maxSlippagePct?: number;
}
export interface SlippageGuardResult {
    /** Whether the action is safe to proceed */
    allowed: boolean;
    /** Estimated slippage in percent */
    estimatedSlippagePct: number;
    /** The threshold that was checked against */
    maxSlippagePct: number;
    /** Human-readable reason if blocked */
    reason: string;
}
/**
 * Check whether a swap or exit is within acceptable slippage bounds.
 *
 * @example
 * const guard = checkSlippage({
 *   protocol:      "uniswap",
 *   tradeValueUSD: 5_000,
 *   poolTvlUSD:    800_000,
 *   maxSlippagePct: 1.0,
 * });
 * if (!guard.allowed) throw new Error(guard.reason);
 */
export declare function checkSlippage(input: SlippageGuardInput): SlippageGuardResult;
//# sourceMappingURL=slippageGuard.d.ts.map