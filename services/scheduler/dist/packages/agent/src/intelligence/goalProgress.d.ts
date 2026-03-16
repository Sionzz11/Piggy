/**
 * Piggy Sentinel — Goal Progress Engine
 *
 * Tracks what percentage of the goal has been reached, classifies
 * milestone events, projects finish date, and generates celebration
 * messages for Penny to deliver at key thresholds.
 */
export type Milestone = 25 | 50 | 75 | 100;
export interface ProgressInput {
    currentBalance: number;
    goalAmount: number;
    startingBalance: number;
    goalStartDate: Date;
    goalDeadline: Date;
    expectedAPY: number;
    monthlyDeposit: number;
}
export interface ProgressResult {
    progressPercent: number;
    currentBalance: number;
    goalAmount: number;
    amountRemaining: number;
    milestonesHit: Milestone[];
    /** Milestone just crossed in this cycle (null if none) */
    newMilestone: Milestone | null;
    projectedFinishDate: Date | null;
    /** Days ahead of deadline (positive = early, negative = late) */
    daysAheadOfDeadline: number | null;
    isComplete: boolean;
    message: string;
}
/**
 * Compute goal progress and milestone status.
 */
export declare function computeGoalProgress(input: ProgressInput, previousProgressPercent?: number): ProgressResult;
//# sourceMappingURL=goalProgress.d.ts.map