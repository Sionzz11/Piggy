// ─────────────────────────────────────────────────────────────────────────────
// @piggy/agent — Transaction Submitter & Agent Wallet
//
// FIX: submitTransaction sekarang di-export dari runner.ts yang punya
// retry logic 3x dengan exponential backoff. Versi lama di file ini
// tidak punya retry — kalau tx gagal sekali langsung throw.
// ─────────────────────────────────────────────────────────────────────────────
import { createPublicClient, http, } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { activeChain } from "@piggy/config/chains";
// Re-export submitTransaction dari runner.ts (ada retry 3x)
export { submitTransaction } from "./runner.js";
function getAgentAccount() {
    const pk = process.env.AGENT_SIGNER_PRIVATE_KEY;
    if (!pk)
        throw new Error("AGENT_SIGNER_PRIVATE_KEY is not set");
    return privateKeyToAccount(pk);
}
const publicClient = createPublicClient({
    chain: activeChain,
    transport: http(),
});
/** Returns the agent signer's Ethereum address. */
export async function getAgentAddress() {
    return getAgentAccount().address;
}
/**
 * Returns the agent wallet's native CELO balance in wei.
 * Used in /health to surface low-balance warnings.
 */
export async function getAgentBalance() {
    const address = getAgentAccount().address;
    return publicClient.getBalance({ address });
}
