import { type Address } from "viem";
export type AssetSymbol = "USDm" | "USDC" | "USDT" | "wETH";
export type Protocol = "aave" | "uniswap" | "mento";
export interface TokenBalances {
    usdm: bigint;
    usdc: bigint;
    usdt: bigint;
    weth: bigint;
}
export interface AavePositions {
    aUSDm: bigint;
    aUSDC: bigint;
    aUSDT: bigint;
}
export interface UniswapPositions {
    tokenIds: number[];
    entryValues: bigint[];
    currentValues: bigint[];
}
export interface CurrentApys {
    usdm: number;
    usdc: number;
    usdt: number;
}
/**
 * FIX — Stable split dalam basis points, dijumlah = 10_000.
 * Digunakan untuk menentukan berapa banyak dari stable bucket
 * yang dialokasikan ke masing-masing aset (USDT/USDC/USDm).
 *
 * Sebelum: hardcoded { usdt: 6000, usdc: 3000, usdm: 1000 } = selalu 60/30/10
 * Sesudah: dikirim dari runGoalCycle berdasarkan hasil optimizeAllocation(live APY)
 *
 * Contoh:
 *   USDT APY 12%, USDC 3%, USDm 1%
 *   → optimizeAllocation → { usdt: 7500, usdc: 2000, usdm: 500 }
 *   → dikirim ke sini sebagai stableSplit
 *   → supply USDT 75%, USDC 20%, USDm 5%  (bukan selalu 60/30/10)
 */
export interface StableSplit {
    usdt: bigint;
    usdc: bigint;
    usdm: bigint;
}
/** Input to the strategy engine */
export interface RebalanceInput {
    userWallet: string;
    executorAddress: string;
    balances: TokenBalances;
    aavePositions: AavePositions;
    uniswapPositions: UniswapPositions;
    currentApys: CurrentApys;
    lastRebalancedAt: Date | null;
    estimatedGasUSD: number;
    wethPriceUSD: number;
    /**
     * FIX — Alokasi optimal dari optimizeAllocation(live APY).
     * Kalau tidak dikirim, fallback ke DEFAULT_STABLE_SPLIT (60/30/10).
     *
     * HARUS dikirim dari runGoalCycle agar supply mengikuti APY tertinggi.
     * Format: { usdm, usdc, usdt } dalam basis points (jumlah = 10_000).
     */
    stableSplit?: {
        usdm: number;
        usdc: number;
        usdt: number;
    };
}
export interface TxCalldata {
    to: Address;
    data: `0x${string}`;
    value: bigint;
    description: string;
}
export interface RebalanceDecision {
    shouldRebalance: boolean;
    skipReason?: string;
    tier: PortfolioTier;
    portfolioUSD: number;
    targetAlloc: TargetAllocation;
    actions: TxCalldata[];
    ilExitsRequired: number[];
    estimatedNewApy: number;
    /** Stable split yang dipakai — untuk logging dan debugging */
    stableSplitUsed: StableSplit;
}
export type PortfolioTier = "nano" | "small" | "mid" | "large";
export interface TargetAllocation {
    stableBps: number;
    lpBps: number;
    wethBps: number;
}
export declare function routeSwap(from: AssetSymbol, to: AssetSymbol): Protocol;
export declare function checkIL(positions: UniswapPositions): number[];
/**
 * FIX — rebalancePortfolio sekarang terima stableSplit dari luar.
 *
 * Masalah lama:
 *   STABLE_SPLIT hardcoded 60/30/10 di dalam fungsi ini.
 *   optimizeAllocation(live APY) dihitung di runGoalCycle tapi tidak dikirim ke sini.
 *   Hasilnya: agent selalu supply USDT 60%, USDC 30%, USDm 10%
 *   meskipun USDT APY 12% dan seharusnya dialokasikan lebih banyak.
 *
 * Fix:
 *   1. Tambah field `stableSplit` di RebalanceInput
 *   2. runGoalCycle mengirim hasil optimizeAllocation sebagai stableSplit
 *   3. Fungsi ini pakai stableSplit tersebut, fallback ke DEFAULT jika tidak ada
 *   4. blendedApy() juga diupdate untuk pakai stableSplit aktual
 */
export declare function rebalancePortfolio(input: RebalanceInput): Promise<RebalanceDecision>;
//# sourceMappingURL=rebalancePortfolio.d.ts.map