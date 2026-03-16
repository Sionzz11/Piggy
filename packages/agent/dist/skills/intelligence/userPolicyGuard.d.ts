/**
 * userPolicyGuard
 *
 * Enforces user-defined policies on every agent action before execution.
 *
 * Supported constraints (stored in goal.policy_json):
 *   maxRiskLevel:           "low" | "medium" | "high"   — never execute if risk > this level
 *   allowedProtocols:       string[]                     — whitelist of protocols
 *   maxAllocationPerProtocol: Record<string, number>     — max % of portfolio in one protocol
 *   maxSingleTxValueUSD:    number                       — reject any single swap > this value
 *   requireProfitability:   boolean                      — hard-gate rebalance on profitability check
 *
 * All constraints are optional and additive.
 * An empty policy object = no restrictions (default, fully autonomous).
 *
 * This module is pure (no I/O) so it is easily unit-testable.
 */
import type { RiskLevel } from "../safety/riskScoringEngine.js";
export interface UserPolicy {
    /** Maximum acceptable risk level for any position or action */
    maxRiskLevel?: RiskLevel;
    /** Whitelist of allowed protocols (e.g. ["aave", "mento"]) */
    allowedProtocols?: string[];
    /**
     * Max percentage of total portfolio value in a single protocol.
     * Key = protocol name, value = max % (0–100).
     * E.g. { "uniswap": 20 } → never put more than 20% in Uniswap LP.
     */
    maxAllocationPerProtocol?: Record<string, number>;
    /** Max value in USD for any single swap transaction */
    maxSingleTxValueUSD?: number;
    /** If true, rebalance is blocked unless profitability check passes */
    requireProfitability?: boolean;
}
export interface PolicyCheckInput {
    /** The intended action (for logging) */
    action: string;
    /** Protocol being used for this action */
    protocol?: string;
    /** Risk score of this action/position */
    riskLevel?: RiskLevel;
    /** USD value of a single tx in this action */
    txValueUSD?: number;
    /** Current allocation as a percent of total portfolio (for max-alloc check) */
    protocolAllocationPct?: number;
    /** Whether the profitability check passed */
    isProfitable?: boolean;
}
export interface PolicyCheckResult {
    allowed: boolean;
    violations: string[];
    reason: string;
}
/**
 * Check whether an intended agent action complies with the user's policy.
 *
 * Returns `allowed: false` with a list of violations if any constraint is breached.
 * Returns `allowed: true` if no constraints are violated.
 *
 * @example
 * const policy: UserPolicy = { maxRiskLevel: "medium", allowedProtocols: ["aave", "mento"] };
 *
 * const check = checkUserPolicy(policy, {
 *   action:   "execute_rebalance",
 *   protocol: "uniswap",
 *   riskLevel: "high",
 * });
 * // check.allowed = false — Uniswap not in allowedProtocols AND risk too high
 */
export declare function checkUserPolicy(policy: UserPolicy, input: PolicyCheckInput): PolicyCheckResult;
/**
 * Parse policy JSON from the DB (goal.policy_json).
 * Returns an empty policy (no restrictions) on parse failure.
 */
export declare function parseUserPolicy(policyJson: unknown): UserPolicy;
//# sourceMappingURL=userPolicyGuard.d.ts.map