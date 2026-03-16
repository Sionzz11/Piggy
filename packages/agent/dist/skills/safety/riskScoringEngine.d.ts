/**
 * riskScoringEngine
 *
 * Produces a composite risk score (0–100) for a position or rebalance action.
 *
 * Score components (each 0–100, weighted):
 *   - apyRisk          (20%) — abnormally high APY signals unsustainability
 *   - liquidityRisk    (25%) — shallow pool depth amplifies slippage + exit risk
 *   - volatilityRisk   (25%) — asset price volatility (stables near 0, WETH higher)
 *   - pegDeviationRisk (30%) — stablecoin peg break is the highest severity event
 *
 * Thresholds mirror Aave's own risk framework and Mento peg monitors.
 *
 * Output:
 *   score     0–33  → LOW
 *   score    34–66  → MEDIUM
 *   score    67–89  → HIGH
 *   score    90–100 → CRITICAL (triggers circuitBreaker)
 */
export type RiskLevel = "low" | "medium" | "high" | "critical";
export interface RiskInput {
    /** Protocol being assessed: "aave" | "mento" | "uniswap" */
    protocol: "aave" | "mento" | "uniswap";
    /** Annual percentage yield for this position (e.g. 8.5 for 8.5%) */
    apy: number;
    /**
     * Total available liquidity in USD.
     * Aave: total pool liquidity.
     * Uniswap: pool TVL.
     * Mento: broker reserves.
     */
    liquidityUSD: number;
    /**
     * 24-hour price volatility as a percentage (e.g. 2.5 for 2.5%).
     * Stablecoins should be < 0.5 under normal conditions.
     */
    volatilityPct: number;
    /**
     * For stablecoins: absolute deviation from $1.00 peg in percent.
     * E.g. $0.985 → pegDeviationPct = 1.5
     * Pass 0 for non-stable assets.
     */
    pegDeviationPct: number;
    /**
     * Optional: pool depth in USD at ±2% price range (Uniswap concentrated liquidity).
     * Smaller depth → higher slippage risk.
     */
    poolDepthUSD?: number;
}
export interface RiskScore {
    score: number;
    level: RiskLevel;
    components: {
        apyRisk: number;
        liquidityRisk: number;
        volatilityRisk: number;
        pegDeviationRisk: number;
    };
    /** Human-readable dominant risk factor */
    dominantFactor: string;
    /** Recommended action based on risk level */
    recommendation: string;
}
/**
 * Compute a composite risk score for a single position or intended action.
 *
 * @example
 * const risk = computeRiskScore({
 *   protocol:        "aave",
 *   apy:             8.9,
 *   liquidityUSD:    4_200_000,
 *   volatilityPct:   0.2,
 *   pegDeviationPct: 0.05,
 * });
 * // → { score: 12, level: "low", ... }
 */
export declare function computeRiskScore(input: RiskInput): RiskScore;
/**
 * Aggregate risk across multiple positions (returns worst-case score).
 * Used by the circuit breaker to decide whether to pause the agent.
 */
export declare function aggregateRiskScores(scores: RiskScore[]): RiskScore;
//# sourceMappingURL=riskScoringEngine.d.ts.map