import { type Hash } from "viem";
import type { TxCalldata } from "@piggy/skills";
/**
 * Submit a transaction.
 * Gas is paid in native CELO from the agent wallet.
 * The agent wallet must hold enough CELO to cover gas fees.
 */
export declare function submitTransaction(tx: TxCalldata): Promise<Hash>;
export declare function getAgentBalance(): Promise<bigint>;
export declare function getAgentAddress(): Promise<string>;
//# sourceMappingURL=runner.d.ts.map