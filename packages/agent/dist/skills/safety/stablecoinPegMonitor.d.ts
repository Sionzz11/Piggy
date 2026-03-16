/**
 * stablecoinPegMonitor
 *
 * Monitors the USD peg of USDm, USDC, and USDT on Celo.
 *
 * Price source:
 *   Mento's on-chain exchange rate: getAmountOut(1e6 stablecoin → USDm)
 *   provides a real-time relative price between Mento-supported stables.
 *   For USDC and USDT this is the best available on-chain oracle on Celo.
 *
 *   USDm itself is measured by querying the Mento broker's median rate,
 *   which is derived from Chainlink CELO/USD + Mento's own TWAP.
 *
 * Fallback:
 *   If on-chain reads fail (RPC outage, contract paused), the monitor
 *   returns a WARN-level alert with the last known price rather than
 *   blocking execution with stale data.
 *
 * Thresholds (env-configurable):
 *   PEG_WARN_THRESHOLD_PCT   default 0.5%  → WARN alert
 *   PEG_ALERT_THRESHOLD_PCT  default 1.0%  → HIGH alert (triggers circuit breaker)
 *   PEG_CRITICAL_THRESHOLD_PCT default 2.0% → CRITICAL (immediate pause)
 */
import { type TokenSymbol } from "@piggy/config/tokens";
export type PegStatus = "ok" | "warn" | "alert" | "critical";
export interface PegReading {
    token: TokenSymbol;
    priceUSD: number;
    deviationPct: number;
    status: PegStatus;
    message: string;
    /** True when the reading is from cache/fallback due to RPC failure */
    isStale: boolean;
    /** Number of consecutive stale reads for this token (0 = fresh) */
    consecutiveStaleCount: number;
}
export interface PegMonitorResult {
    readings: PegReading[];
    worstStatus: PegStatus;
    /** Any token in alert or critical state */
    hasAlert: boolean;
    /** Any token in critical state */
    hasCritical: boolean;
}
/**
 * Check peg stability for all three Piggy stables.
 *
 * Stale-read escalation:
 *   - 1st stale read  → "warn"  (RPC blip, assume peg)
 *   - Nth stale read (N ≥ STALE_ESCALATION_COUNT) → "alert"
 *     The circuit breaker treats "alert" as a serious signal even without
 *     a confirmed price, preventing a sustained RPC outage from hiding a
 *     real depeg event.
 *
 * @example
 * const peg = await checkStablecoinPegs();
 * if (peg.hasCritical) triggerCircuitBreaker("peg_break", peg);
 */
export declare function checkStablecoinPegs(): Promise<PegMonitorResult>;
/** Exposed for testing — resets all stale counters */
export declare function _resetStaleCountersForTesting(): void;
//# sourceMappingURL=stablecoinPegMonitor.d.ts.map