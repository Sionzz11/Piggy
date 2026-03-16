/**
 * protocolHealthMonitor
 *
 * Monitors the operational health of Aave V3, Mento, and Uniswap on Celo.
 *
 * Checks per protocol:
 *   Aave:    - Pool is not paused (IPool.paused())
 *             - Reserve is active and not frozen (getReserveData)
 *             - Utilization rate < AAVE_MAX_UTILIZATION_PCT (high util = hard to withdraw)
 *
 *   Mento:   - Broker has reserves (broker.getAmountOut doesn't revert)
 *             - Last oracle update < ORACLE_STALENESS_SECONDS old
 *
 *   Uniswap: - Pool liquidity > MIN_POOL_LIQUIDITY_USD
 *             - Observation cardinality > 1 (TWAP oracle has history)
 *
 * Each check returns a ProtocolHealthReport with a health status:
 *   "healthy" | "degraded" | "unavailable"
 *
 * The scheduler calls this once per cycle and feeds the result to the
 * risk scoring engine and circuit breaker.
 */
export type ProtocolHealthStatus = "healthy" | "degraded" | "unavailable";
export interface ProtocolHealthReport {
    protocol: "aave" | "mento" | "uniswap";
    status: ProtocolHealthStatus;
    utilizationPct?: number;
    details: string[];
    warnings: string[];
}
export interface SystemHealthResult {
    aave: ProtocolHealthReport;
    mento: ProtocolHealthReport;
    uniswap: ProtocolHealthReport;
    overallStatus: ProtocolHealthStatus;
    /** Any protocol is unavailable — agent should not execute */
    hasUnavailable: boolean;
    /** Any protocol is degraded — agent should be cautious */
    hasDegraded: boolean;
}
/**
 * Run health checks across all three protocols and return a consolidated report.
 *
 * @example
 * const health = await checkProtocolHealth();
 * if (health.hasUnavailable) return; // skip this cycle
 */
export declare function checkProtocolHealth(): Promise<SystemHealthResult>;
//# sourceMappingURL=protocolHealthMonitor.d.ts.map