/**
 * circuitBreaker
 *
 * Emergency pause system for the Piggy Sentinel agent.
 *
 * Triggers (any one is sufficient to trip the breaker):
 *   1. Stablecoin peg deviation exceeds PEG_CRITICAL_THRESHOLD_PCT
 *   2. Protocol risk score is "critical" (score ≥ 90)
 *   3. Price volatility spike (asset moves > VOLATILITY_SPIKE_PCT in 24h)
 *
 * When tripped:
 *   - Sets soft_paused = true for the affected goal via the DB
 *   - Emits a structured agentscan event
 *   - Queues a Telegram notification to the user
 *   - Returns a CircuitBreakerResult with the trigger reason
 *
 * Auto-reset:
 *   The breaker does NOT auto-reset.  The user must manually resume via
 *   POST /api/goals/:id/resume, which clears soft_paused after they have
 *   reviewed the situation.  This matches the non-custodial design where
 *   humans remain in control during abnormal conditions.
 */
import type { RiskScore } from "./riskScoringEngine.js";
import type { PegMonitorResult } from "./stablecoinPegMonitor.js";
export type CircuitBreakerTrigger = "peg_deviation" | "critical_risk_score" | "volatility_spike" | "manual";
export interface CircuitBreakerInput {
    goalId: string;
    userWallet: string;
    agentWallet: string;
    /** Current peg monitor result (pass null to skip peg check) */
    pegResult?: PegMonitorResult | null;
    /** Aggregated risk score (pass null to skip risk check) */
    riskScore?: RiskScore | null;
    /**
     * 24h price volatility of the dominant asset in the portfolio (%).
     * Pass null to skip volatility check.
     */
    volatilityPct?: number | null;
}
export interface CircuitBreakerResult {
    /** Whether the circuit breaker was tripped */
    tripped: boolean;
    trigger?: CircuitBreakerTrigger;
    reason?: string;
    /** Notification message sent to user (for logging) */
    message?: string;
}
/**
 * Evaluate circuit breaker conditions.  If any trigger fires:
 *   1. Soft-pauses the goal in the DB
 *   2. Emits agentscan event
 *   3. Sends Telegram notification
 *
 * Returns immediately after first trigger (fail-fast).
 *
 * @example
 * const cb = await evaluateCircuitBreaker({
 *   goalId,
 *   userWallet,
 *   agentWallet,
 *   pegResult,
 *   riskScore,
 *   volatilityPct,
 * });
 * if (cb.tripped) return; // skip rest of cycle
 */
export declare function evaluateCircuitBreaker(input: CircuitBreakerInput): Promise<CircuitBreakerResult>;
//# sourceMappingURL=circuitBreaker.d.ts.map