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
import { logger } from "@piggy/shared";
// ── Default thresholds ─────────────────────────────────────────────────────
const DEFAULT_MAX_SLIPPAGE = {
    uniswap: parseFloat(process.env.MAX_SLIPPAGE_UNISWAP_PCT ?? "1.0"),
    mento: parseFloat(process.env.MAX_SLIPPAGE_MENTO_PCT ?? "0.5"),
    aave: 0, // supply/withdraw have no slippage
};
// ── Slippage estimators ────────────────────────────────────────────────────
/**
 * Constant-product approximation: Δprice/price ≈ tradeSize / (poolTVL/2)
 * This slightly overestimates slippage (conservative = safer for users).
 */
function estimateUniswapSlippage(tradeValueUSD, poolTvlUSD) {
    if (poolTvlUSD <= 0)
        return 100; // empty pool → 100% slippage
    // Each side of the pool = TVL/2
    const halfPool = poolTvlUSD / 2;
    // Slippage ≈ trade / (pool_reserve + trade)  × 100
    return (tradeValueUSD / (halfPool + tradeValueUSD)) * 100;
}
/**
 * Mento uses a flat-fee model with small spread.
 * Slippage ≈ fee + spread (spread is ~0.1% for well-capitalised pairs).
 */
function estimateMentoSlippage(feePct) {
    const MENTO_SPREAD_PCT = 0.10; // observed on-chain spread
    return feePct + MENTO_SPREAD_PCT;
}
// ── Main export ────────────────────────────────────────────────────────────
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
export function checkSlippage(input) {
    const maxSlippagePct = input.maxSlippagePct
        ?? DEFAULT_MAX_SLIPPAGE[input.protocol];
    // Aave: no slippage — always allow
    if (input.protocol === "aave") {
        return {
            allowed: true,
            estimatedSlippagePct: 0,
            maxSlippagePct: 0,
            reason: "Aave supply/withdraw has no slippage.",
        };
    }
    let estimatedSlippagePct;
    if (input.protocol === "uniswap") {
        if (!input.poolTvlUSD) {
            logger.warn("slippageGuard: poolTvlUSD not provided for Uniswap — blocking as precaution");
            return {
                allowed: false,
                estimatedSlippagePct: 100,
                maxSlippagePct,
                reason: "Cannot estimate Uniswap slippage without poolTvlUSD — execution blocked.",
            };
        }
        estimatedSlippagePct = estimateUniswapSlippage(input.tradeValueUSD, input.poolTvlUSD);
    }
    else {
        // mento
        const feePct = input.mentoFeePct ?? 0.30;
        estimatedSlippagePct = estimateMentoSlippage(feePct);
    }
    const allowed = estimatedSlippagePct <= maxSlippagePct;
    const reason = allowed
        ? `Slippage ${estimatedSlippagePct.toFixed(3)}% is within ${maxSlippagePct}% limit.`
        : `Slippage ${estimatedSlippagePct.toFixed(3)}% exceeds ${maxSlippagePct}% limit — execution blocked.`;
    logger.info("slippageGuard: checked", {
        protocol: input.protocol,
        tradeValueUSD: input.tradeValueUSD,
        estimatedSlippagePct: estimatedSlippagePct.toFixed(3),
        maxSlippagePct,
        allowed,
    });
    return { allowed, estimatedSlippagePct, maxSlippagePct, reason };
}
