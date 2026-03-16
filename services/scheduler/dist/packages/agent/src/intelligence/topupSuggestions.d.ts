/**
 * Piggy Sentinel — Smart Top-Up Suggestions
 *
 * When the user is behind pace, compute the optimal one-time or recurring
 * top-up amount that would bring them back on track.
 *
 * Two modes:
 *   1. Catch-up now  — single lump-sum to restore expected trajectory
 *   2. Spread it out — extra monthly amount for remainder of goal
 *
 * Formula for lump-sum catch-up:
 *   lumpSum = expectedBalance − currentBalance
 *   (no yield adjustment since it's an immediate top-up)
 *
 * Formula for spread catch-up:
 *   FV_annuity(extraPMT, r, remainingMonths) = goalGap
 *   extraPMT = goalGap × r/12 / ((1+r/12)^n − 1)
 */
import type { PaceResult } from "./paceTracking.js";
export interface TopUpInput {
    paceResult: PaceResult;
    goalAmount: number;
    expectedAPY: number;
    existingMonthlyDeposit: number;
}
export interface TopUpSuggestion {
    /** Is a top-up actually recommended? */
    recommended: boolean;
    /** Recommended one-time lump sum to catch up immediately */
    catchUpLumpSum: number;
    /** Recommended increase to monthly deposit for the rest of the goal */
    extraMonthlyDeposit: number;
    /** Current monthly (for display) */
    currentMonthly: number;
    /** New total monthly after increase */
    newTotalMonthly: number;
    /** Friendly message from Penny */
    message: string;
}
/**
 * Compute top-up suggestions when the user is behind pace.
 */
export declare function computeTopUpSuggestion(input: TopUpInput): TopUpSuggestion;
//# sourceMappingURL=topupSuggestions.d.ts.map