import { type Address } from "viem";
export { submitTransaction } from "./runner.js";
/** Returns the agent signer's Ethereum address. */
export declare function getAgentAddress(): Promise<Address>;
/**
 * Returns the agent wallet's native CELO balance in wei.
 * Used in /health to surface low-balance warnings.
 */
export declare function getAgentBalance(): Promise<bigint>;
//# sourceMappingURL=index.d.ts.map