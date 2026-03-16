import type { AgentDecision } from "@piggy/shared";
import type { RiskScore } from "./skills/safety/riskScoringEngine.js";
import type { SystemHealthResult } from "./skills/intelligence/protocolHealthMonitor.js";
export interface DecisionInput {
    goalId: string;
    userWallet: string;
    softPaused: boolean;
    goalStatus: string;
    lastRebalancedAt: Date | null;
    /** APY saat rebalance terakhir — untuk hitung drift akurat */
    lastBlendedApy?: number;
    portfolio: {
        stableUSD: number;
        lpUSD: number;
        wethUSD: number;
        totalUSD: number;
    };
    apys: {
        usdt: number;
        usdc: number;
        usdm: number;
    };
    estimatedGasUSD: number;
    /**
     * Aggregated risk score from riskScoringEngine.
     * When level is "high" or "critical", execution is blocked.
     * Pass undefined to skip risk-based guardrails (e.g. first-run before safety stack is warm).
     */
    riskScore?: RiskScore;
    /**
     * Protocol health from protocolHealthMonitor.
     * When any protocol is "degraded", agent is cautious but still executes.
     * "unavailable" is handled upstream before makeDecision is called.
     */
    protocolHealth?: SystemHealthResult;
}
/**
 * Core decision logic — pure function, no side effects.
 *
 * Guardrails (any failure → skip):
 *   1. Not soft-paused
 *   2. Portfolio >= MIN_REBALANCE_AMOUNT
 *   3. Not rebalanced in last 24h (unless first alloc)
 *   4. APY drift > APY_CHANGE_THRESHOLD_PCT from current blended
 *   5. Gas cost < MAX_GAS_TO_YIELD_RATIO_PCT % of annual yield
 */
export declare function makeDecision(input: DecisionInput): AgentDecision;
//# sourceMappingURL=decisionEngine.d.ts.map