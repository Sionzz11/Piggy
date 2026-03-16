import { defineChain } from "viem";
// ── RPC URLs ──────────────────────────────────────────────────────────────────
//
// FIX: multiple RPC fallbacks untuk reliability.
// viem otomatis fallback ke URL berikutnya kalau request gagal.
// Kalau forno down → drpc.org dipakai → agent tetap jalan.
//
// Tambah CELO_RPC_URL_MAINNET_2 di .env untuk custom secondary RPC
// (contoh: Infura, Alchemy, QuickNode)
const MAINNET_RPCS = [
    process.env.CELO_RPC_URL_MAINNET ?? "https://forno.celo.org",
    process.env.CELO_RPC_URL_MAINNET_2 ?? "https://celo.drpc.org",
    "https://rpc.ankr.com/celo",
];
const SEPOLIA_RPCS = [
    process.env.CELO_RPC_URL_SEPOLIA ?? "https://forno.celo-sepolia.celo.org",
    process.env.CELO_RPC_URL_SEPOLIA_2 ?? "https://celo-sepolia.drpc.org",
];
export const celoSepolia = defineChain({
    id: 11142220,
    name: "Celo Sepolia",
    nativeCurrency: { name: "CELO", symbol: "CELO", decimals: 18 },
    rpcUrls: {
        default: {
            http: SEPOLIA_RPCS,
        },
    },
    blockExplorers: {
        default: { name: "Blockscout", url: "https://celo-sepolia.blockscout.com" },
    },
    testnet: true,
});
export const celoMainnet = defineChain({
    id: 42220,
    name: "Celo",
    nativeCurrency: { name: "CELO", symbol: "CELO", decimals: 18 },
    rpcUrls: {
        default: {
            http: MAINNET_RPCS,
        },
    },
    blockExplorers: {
        default: { name: "Blockscout", url: "https://celo.blockscout.com" },
    },
    testnet: false,
});
const APP_ENV = (process.env.APP_ENV ?? "dev");
const CHAIN_MAP = {
    dev: celoSepolia,
    staging: celoSepolia,
    fork: celoMainnet, // fork = Anvil local, chainId 42220 (mainnet state)
    prod: celoMainnet,
};
export const activeChain = CHAIN_MAP[APP_ENV];
export const CHAIN_ID = activeChain.id;
export const IS_MAINNET = CHAIN_ID === 42220;
export const IS_TESTNET = !IS_MAINNET;
export function getChain(id) {
    if (id === 11142220)
        return celoSepolia;
    if (id === 42220)
        return celoMainnet;
    throw new Error(`Unsupported chain ID: ${id}`);
}
