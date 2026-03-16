import type { Address } from "viem";
export type DeployedContractName = "sentinelExecutor" | "aaveAdapter" | "mentoAdapter" | "uniswapAdapter" | "aaveOracleWrapper";
/**
 * Get the deployed address for a contract on the given chain.
 *
 * Returns undefined if the contract hasn't been deployed yet
 * (env var missing or still set to placeholder).
 *
 * Call sites should guard:
 *   const addr = getDeployedAddress(CHAIN_ID, "sentinelExecutor");
 *   if (!addr) throw new Error("SentinelExecutor not deployed");
 */
export declare function getDeployedAddress(chainId: number, contractName: DeployedContractName): Address;
/**
 * Like getDeployedAddress but returns undefined instead of throwing.
 * Useful for optional features (e.g. Uniswap adapter may not be deployed yet).
 */
export declare function tryGetDeployedAddress(chainId: number, contractName: DeployedContractName): Address | undefined;
//# sourceMappingURL=contracts.d.ts.map