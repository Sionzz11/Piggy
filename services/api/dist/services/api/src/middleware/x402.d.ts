import type { FastifyRequest, FastifyReply } from "fastify";
/**
 * Fastify preHandler — attach to /api/chat route.
 *
 * Usage:
 *   app.post("/api/chat", { preHandler: x402PaymentGate }, handler)
 */
export declare function x402PaymentGate(req: FastifyRequest, reply: FastifyReply): Promise<void>;
//# sourceMappingURL=x402.d.ts.map