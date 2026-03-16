/**
 * agentscan emitter — never throws, never blocks execution.
 * Called after every confirmed on-chain action.
 */
export interface EmitPayload {
    agentWalletAddress: string;
    skillName: string;
    eventType: string;
    txHash: string | null;
    metadata: Record<string, unknown>;
}
export interface EmitResult {
    eventId: string | null;
    explorerUrl: string | null;
}
export declare function emitAgentEvent(payload: EmitPayload): Promise<EmitResult>;
//# sourceMappingURL=agentscan.d.ts.map