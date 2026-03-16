/**
 * txSimulation
 *
 * Simulates a transaction before sending it on-chain using viem's
 * publicClient.call() (equivalent to eth_call / callStatic).
 *
 * Detects:
 *   - Revert (contract error / insufficient balance / access control)
 *   - Gas usage above safety ceiling (prevents stuck/expensive txs)
 *   - Empty return data on non-view calls (often signals a proxy misconfiguration)
 *
 * All agent transactions MUST pass simulation before submitTransaction() is called.
 * If simulation fails the action is logged and skipped — never silently submitted.
 *
 * Gas ceiling env override: MAX_GAS_PER_TX (default 800_000 units)
 */
import { type Address, type Hex } from "viem";
export interface SimulationInput {
    /** Target contract address */
    to: Address;
    /** ABI-encoded calldata */
    data: Hex;
    /** Native value in wei (usually 0 for ERC-20 ops) */
    value: bigint;
    /**
     * Sender address (usually the agent signer EOA or SentinelExecutor).
     * Defaults to agentSigner env var.
     */
    from?: Address;
    /** Human label for log output */
    description?: string;
}
export interface SimulationResult {
    success: boolean;
    /** Estimated gas units (only present on success) */
    estimatedGas?: bigint;
    /** Revert reason string (only present on failure) */
    revertReason?: string;
    /** Raw return data */
    returnData?: Hex;
}
/**
 * Simulate a transaction using eth_call + eth_estimateGas.
 *
 * Returns a SimulationResult.  Does NOT throw — callers check `.success`.
 *
 * @example
 * const sim = await simulateTransaction({
 *   to:          executorAddr,
 *   data:        encodedCalldata,
 *   value:       0n,
 *   description: "rebalance: supply USDT to Aave",
 * });
 * if (!sim.success) {
 *   logger.error("tx simulation failed", sim.revertReason);
 *   return; // skip this action
 * }
 */
export declare function simulateTransaction(input: SimulationInput): Promise<SimulationResult>;
/**
 * Simulate a batch of transactions.
 * Returns early on the first failure (transactions are ordered dependencies).
 */
export declare function simulateBatch(txs: SimulationInput[]): Promise<{
    allPassed: boolean;
    failedIndex?: number;
    result?: SimulationResult;
}>;
//# sourceMappingURL=txSimulation.d.ts.map