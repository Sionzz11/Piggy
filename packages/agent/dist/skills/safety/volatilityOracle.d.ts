/**
 * volatilityOracle
 *
 * Derives 24-hour price volatility from the Uniswap V3 USDC/WETH pool
 * TWAP oracle using the `observe([86400, 0])` call.
 *
 * Method:
 *   Uniswap V3 accumulates tick values over time.  By reading two points
 *   on the accumulator — now (secondsAgo=0) and 24h ago (secondsAgo=86400)
 *   — we can derive the geometric mean price over the interval.
 *
 *   tickCumulative = ∑ tick × seconds
 *   meanTick = (tickCumulative[now] - tickCumulative[24h ago]) / 86400
 *   price = 1.0001^tick  (the standard Uniswap V3 price formula)
 *
 * Volatility = |price_now - price_24h_ago| / price_24h_ago × 100 (%)
 *
 * This is absolute 24h return (not annualised).  For a stablecoin-dominated
 * portfolio, the dominant volatility driver is WETH, so this is used as the
 * portfolio's volatility proxy.
 *
 * Fallback:
 *   Returns null if the pool address is not configured or the RPC call fails.
 *   The circuit breaker skips the volatility check when volatilityPct is null.
 *
 * Env:
 *   UNISWAP_USDC_WETH_POOL  — pool address (required; set after contract deploy)
 */
export interface VolatilityResult {
    volatilityPct: number;
    priceNow: number;
    price24hAgo: number;
    source: "uniswap_twap";
}
/**
 * Compute 24h WETH price volatility from Uniswap V3 TWAP.
 *
 * Returns null if pool is not configured or RPC fails.
 * The circuit breaker passes this directly to `volatilityPct`.
 *
 * @example
 * const vol = await fetchVolatility24h();
 * // vol = { volatilityPct: 3.7, priceNow: 3200, price24hAgo: 3082 }
 */
export declare function fetchVolatility24h(): Promise<VolatilityResult | null>;
//# sourceMappingURL=volatilityOracle.d.ts.map