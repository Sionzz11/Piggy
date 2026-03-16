import type { FastifyRequest, FastifyReply } from "fastify";
export interface AuthedRequest extends FastifyRequest {
    verifiedWallet: string;
}
export declare function requireAuth(req: FastifyRequest & {
    verifiedWallet?: string;
}, reply: FastifyReply): Promise<void>;
export declare function assertOwns(req: FastifyRequest & {
    verifiedWallet?: string;
}, goalOwnerWallet: string): string | null;
//# sourceMappingURL=auth.d.ts.map