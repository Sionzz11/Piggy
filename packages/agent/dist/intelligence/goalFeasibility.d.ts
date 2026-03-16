/**
 * Piggy Sentinel — Goal Feasibility Engine
 *
 * Given the user's current balance, goal amount, time horizon, and
 * expected APY, determine whether the goal is achievable and how
 * much additional monthly deposit (if any) is required.
 *
 * Formula: FV = P × (1 + r)^t
 *   P = currentBalance
 *   r = expectedAPY (annual, decimal)
 *   t = years
 *
 * Monthly deposit component uses future value of annuity:
 *   FV_annuity = PMT × [((1+r/12)^n − 1) / (r/12)]
 *   PMT = (goalGap × r/12) / ((1 + r/12)^n − 1)
 */
export interface FeasibilityInput {
    /** Current balance in USD */
    currentBalance: number;
    /** Savings target in USD */
    goalAmount: number;
    /** Time horizon in months */
    timeHorizonMonths: number;
    /** Expected blended APY as decimal (e.g. 0.0622 for 6.22%) */
    expectedAPY: number;
    /** Optional additional monthly deposit user has committed */
    plannedMonthlyDeposit?: number;
}
export interface FeasibilityResult {
    /** FV of current balance alone, with compound interest */
    projectedValueFromBalance: number;
    /** FV including planned monthly deposits */
    projectedValueTotal: number;
    /** How far short the projection is from the goal (0 if achievable) */
    goalGap: number;
    /** Extra monthly deposit needed to close the gap (0 if already achievable) */
    requiredMonthlyDeposit: number;
    /** Whether the goal is reachable without any additional deposits */
    achievableWithBalance: boolean;
    /** Whether the goal is reachable with the planned monthly deposit */
    achievableWithPlan: boolean;
    /** Structured message Penny can send to the user */
    message: string;
    /** Short verdict for UI badges */
    verdict: "on_track" | "needs_deposits" | "needs_more_deposits" | "unreachable";
}
/**
 * Run feasibility analysis and return financial planning feedback.
 */
export declare function analyzeGoalFeasibility(input: FeasibilityInput): FeasibilityResult;
//# sourceMappingURL=goalFeasibility.d.ts.map