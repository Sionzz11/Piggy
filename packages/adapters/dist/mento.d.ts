import { type Address } from "viem";
import type { TokenSymbol } from "@piggy/config/tokens";
/**
 * Get the token address for a symbol — convenience re-export
 * so callers don't need to import @piggy/config separately.
 */
export declare function tokenAddress(symbol: TokenSymbol): Address;
/**
 * Query Mento broker for expected amountOut given amountIn.
 *
 * Falls back to a 1:1 estimate (minus slippage) if the pair isn't
 * registered or the RPC call fails — this is conservative and safe
 * since the on-chain swap will revert if minAmountOut isn't met.
 */
declare function getAmountOut(from: TokenSymbol, to: TokenSymbol, amountIn: bigint): Promise<bigint>;
/**
 * Compute minAmountOut for a Mento swap with slippage protection.
 *
 * @param from         - Input token symbol
 * @param to           - Output token symbol
 * @param amountIn     - Input amount in from-token native decimals
 * @param slippagePct  - Max acceptable slippage % (e.g. 1.0 = 1%)
 * @returns minAmountOut in to-token native decimals
 */
export declare function computeMinAmountOut(from: TokenSymbol, to: TokenSymbol, amountIn: bigint, slippagePct: number): Promise<bigint>;
/**
 * mento namespace — imported as `import { mento } from "@piggy/adapters"`
 */
export declare const mento: {
    readonly computeMinAmountOut: typeof computeMinAmountOut;
    readonly tokenAddress: typeof tokenAddress;
    readonly getAmountOut: typeof getAmountOut;
};
export {};
//# sourceMappingURL=mento.d.ts.map