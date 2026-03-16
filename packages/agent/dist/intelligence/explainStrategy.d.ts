/**
 * Piggy Sentinel — Strategy Explanation Engine
 *
 * Translates the agent's mechanical decision output into
 * plain-English financial reasoning that Penny can deliver to the user.
 *
 * Covers:
 *   - Why a rebalance was triggered
 *   - Why a rebalance was skipped
 *   - Why an IL exit happened
 *   - What the current allocation means
 *   - Why a specific risk profile was chosen
 */
import type { AgentDecision } from "@piggy/shared";
type PortfolioTier = "nano" | "small" | "mid" | "large";
export interface RebalanceContext {
    decision: AgentDecision;
    previousApys?: {
        usdm: number;
        usdc: number;
        usdt: number;
    };
    currentApys: {
        usdm: number;
        usdc: number;
        usdt: number;
    };
    previousAllocBps?: {
        stableBps: number;
        lpBps: number;
        wethBps: number;
    };
    driftPercent?: number;
    ilExited?: number;
}
export interface ExplanationResult {
    /** One-sentence headline */
    headline: string;
    /** Full explanation (2–4 sentences) */
    detail: string;
    /** Combined message ready for Penny to send */
    message: string;
}
/**
 * Generate an explanation for the agent's rebalance decision.
 */
export declare function explainRebalance(ctx: RebalanceContext): ExplanationResult;
/**
 * Explain an IL (impermanent loss) exit.
 */
export declare function explainILExit(positionCount: number, ilPercent: number): ExplanationResult;
/**
 * Explain current portfolio allocation in plain English.
 */
export declare function explainAllocation(alloc: {
    stableBps: number;
    lpBps: number;
    wethBps: number;
}, estimatedApy: number, tier: PortfolioTier): string;
export {};
//# sourceMappingURL=explainStrategy.d.ts.map