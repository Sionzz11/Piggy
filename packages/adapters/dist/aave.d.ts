import type { TokenSymbol } from "@piggy/config/tokens";
/**
 * Get live APY (%) for an asset from Aave V3 on-chain data.
 *
 * liquidityRate is in RAY (1e27). APY ≈ liquidityRate / RAY * 100.
 * This is a simplification — exact APY accounts for compounding,
 * but the difference is negligible for short rebalance intervals.
 *
 * @param symbol - Token symbol: "USDm", "USDC", or "USDT"
 * @returns APY as a percentage number (e.g. 8.89 for 8.89%)
 */
export declare function getCurrentApy(symbol: TokenSymbol): Promise<number>;
//# sourceMappingURL=aave.d.ts.map