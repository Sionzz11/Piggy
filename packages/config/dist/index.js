// ─────────────────────────────────────────────────────────────────────────────
// @piggy/config — Public API
// ─────────────────────────────────────────────────────────────────────────────
export { celoMainnet, celoSepolia, // FIX: ganti celoAlfajores → celoSepolia (chain ID 11142220)
activeChain, IS_MAINNET, IS_TESTNET, CHAIN_ID, getChain,
// RPC_URL dihapus — pakai activeChain.rpcUrls.default.http[0] langsung
 } from "./chains.js";
export { getTokenAddress, getAllTokenAddresses, getTokenDecimals, } from "./tokens.js";
export { getDeployedAddress, tryGetDeployedAddress, } from "./contracts.js";
export * from "./protocols.js";
