/**
 * withdrawPlanner
 *
 * Generates a safe, ordered plan to unwind all positions and return
 * funds to the user when they request a withdrawal.
 *
 * Unwind order (optimized to minimize slippage and gas):
 *   1. Exit Uniswap LP positions first (high IL risk if left open)
 *   2. Withdraw Aave aToken positions (USDm, USDC, USDT)
 *   3. Swap any non-target tokens to the user's preferred output token
 *   4. Return funds to userWallet
 *
 * Safety checks applied per step:
 *   - Aave withdrawal: check if reserve has enough available liquidity
 *     (utilization < 99%) before queuing the tx
 *   - Slippage guard on any swap steps
 *   - Gas policy check before submitting the batch
 *
 * Returns an ordered list of WithdrawAction objects that the caller
 * (runGoalCycle or a dedicated withdraw job) submits one by one.
 */
export type WithdrawActionType = "exit_lp" | "aave_withdraw" | "mento_swap" | "uniswap_swap";
export interface WithdrawAction {
    step: number;
    type: WithdrawActionType;
    description: string;
    /** Estimated USD value being moved */
    valueUSD: number;
    /** Whether this step is safe to execute (slippage/liquidity checks passed) */
    safe: boolean;
    /** Reason if not safe */
    warning?: string;
}
export interface WithdrawPlan {
    totalValueUSD: number;
    actions: WithdrawAction[];
    /** True if every action is safe to execute */
    allSafe: boolean;
    /** Actions that failed safety checks */
    unsafeActions: WithdrawAction[];
    summary: string;
}
export interface WithdrawPlanInput {
    userWallet: string;
    /** Aave positions in USD */
    aavePositions: {
        usdmUSD: number;
        usdcUSD: number;
        usdtUSD: number;
    };
    /** Uniswap LP positions */
    uniswapPositions: Array<{
        tokenId: number;
        valueUSD: number;
        poolTvlUSD?: number;
    }>;
    /** Raw wallet stables (may need swap) */
    walletBalances: {
        usdmUSD: number;
        usdcUSD: number;
        usdtUSD: number;
        wethUSD: number;
    };
    /** Target output token the user wants to receive (default: USDC) */
    targetToken?: "USDm" | "USDC" | "USDT";
    /** Mento pool TVL for swap slippage estimates */
    mentoPooTvlUSD?: number;
}
/**
 * Build a safe, ordered withdraw plan for the given portfolio state.
 *
 * @example
 * const plan = buildWithdrawPlan({ aavePositions, uniswapPositions, ... });
 * for (const action of plan.actions) {
 *   if (!action.safe) { notify user; skip; }
 *   await submitTransaction(buildWithdrawTx(action));
 * }
 */
export declare function buildWithdrawPlan(input: WithdrawPlanInput): WithdrawPlan;
//# sourceMappingURL=withdrawPlanner.d.ts.map