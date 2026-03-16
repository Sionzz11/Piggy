import { parseUnits, formatUnits } from "viem";
export const toWei = (n) => parseUnits(String(n), 18);
export const fromWei = (n, dp = 4) => parseFloat(formatUnits(n, 18)).toFixed(dp);
export const calcApprovalAmount = (goal, bufferPct = 5) => goal + (goal * BigInt(bufferPct)) / 100n;
export const calcMinAmountOut = (expected, slippagePct = 0.5) => (expected * BigInt(Math.round((1 - slippagePct / 100) * 10_000))) / 10000n;
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const generateCode = (len = 6) => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
};
export const logger = {
    info: (msg, meta) => console.log(`[INFO]  ${msg}`, meta ?? ""),
    warn: (msg, meta) => console.warn(`[WARN]  ${msg}`, meta ?? ""),
    error: (msg, meta) => console.error(`[ERROR] ${msg}`, meta ?? ""),
    debug: (msg, meta) => { if (process.env.DEBUG)
        console.debug(`[DEBUG] ${msg}`, meta ?? ""); },
};
