import { type Address } from "viem";
export interface UniswapPositions {
    tokenIds: number[];
    entryValues: bigint[];
    currentValues: bigint[];
}
/**
 * Check all LP positions for impermanent loss exceeding threshold.
 * Returns tokenIds that should be exited.
 */
export declare function checkIL(positions: UniswapPositions): number[];
export interface TxCalldata {
    to: Address;
    data: `0x${string}`;
    value: bigint;
    description?: string;
}
export interface RebalanceInput {
    userWallet: string;
    executorAddress: string;
    balances: {
        usdm: bigint;
        usdc: bigint;
        usdt: bigint;
        weth: bigint;
    };
    aavePositions: {
        aUSDm: bigint;
        aUSDC: bigint;
        aUSDT: bigint;
    };
    uniswapPositions: UniswapPositions;
    currentApys: {
        usdt: number;
        usdc: number;
        usdm: number;
    };
    lastRebalancedAt: Date | null;
    estimatedGasUSD: number;
    wethPriceUSD: number;
    stableSplit?: {
        usdt: number;
        usdc: number;
        usdm: number;
    };
}
export interface RebalanceResult {
    shouldRebalance: boolean;
    skipReason?: string;
    actions: TxCalldata[];
    estimatedNewApy: number;
}
/**
 * Determine if a rebalance is needed and build the calldata.
 *
 * Uses the same guardrails as decisionEngine but focused on the
 * actual token movements needed.
 */
export declare function rebalancePortfolio(input: RebalanceInput): Promise<RebalanceResult>;
//# sourceMappingURL=index.d.ts.map