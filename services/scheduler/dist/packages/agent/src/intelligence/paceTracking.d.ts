/**
 * Piggy Sentinel — Pace Tracking Engine
 *
 * Compares current balance against where the user should be at this point
 * in time to reach their goal, accounting for compound yield.
 *
 * Expected balance at time T uses the same FV formula as feasibility:
 *   expectedBalance = P₀ × (1 + r/12)^elapsed + PMT × [((1+r/12)^elapsed − 1) / (r/12)]
 *
 * Thresholds:
 *   ahead_of_pace   → currentBalance > expectedBalance × 1.05
 *   on_track        → within ±5% of expected
 *   behind_pace     → currentBalance < expectedBalance × 0.95
 */
export type PaceStatus = "ahead_of_pace" | "on_track" | "behind_pace";
export interface PaceInput {
    /** Current balance in USD */
    currentBalance: number;
    /** Balance at goal activation (principal) in USD */
    startingBalance: number;
    /** Savings target in USD */
    goalAmount: number;
    /** Months elapsed since goal activation */
    monthsElapsed: number;
    /** Total goal duration in months */
    totalMonths: number;
    /** Expected blended APY as decimal */
    expectedAPY: number;
    /** Monthly deposit committed (0 if none) */
    monthlyDeposit: number;
}
export interface PaceResult {
    paceStatus: PaceStatus;
    currentBalance: number;
    expectedBalance: number;
    /** Positive = ahead, negative = behind */
    balanceDelta: number;
    /** As percentage of expected balance */
    deltaPercent: number;
    progressPercent: number;
    monthsRemaining: number;
    /** Concise message for Penny to deliver */
    message: string;
}
/**
 * Determine pace status against expected trajectory.
 */
export declare function trackPace(input: PaceInput): PaceResult;
//# sourceMappingURL=paceTracking.d.ts.map