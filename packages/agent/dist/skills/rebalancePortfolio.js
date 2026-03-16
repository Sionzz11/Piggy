import { logger } from "@piggy/shared";
import { getTokenAddress } from "@piggy/config/tokens";
import { CHAIN_ID } from "@piggy/config/chains";
import { encodeFunctionData, parseUnits, formatUnits, } from "viem";
import { SENTINEL_EXECUTOR_ABI } from "@piggy/shared";
/** Basis points precision (10_000 = 100%) */
const BPS = 10000n;
// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const MIN_REBALANCE_USD = 200;
const REBALANCE_INTERVAL_MS = 24 * 60 * 60 * 1000;
const DRIFT_THRESHOLD_BPS = 1_000;
const MAX_LP_BPS = 3_000;
const IL_STOP_LOSS_BPS = 500;
const SLIPPAGE_BPS = 100n;
const ONE_18 = parseUnits("1", 18);
/** Tier allocation rules (bps, must sum to 10_000) */
const TIER_ALLOCATIONS = {
    nano: { stableBps: 10_000, lpBps: 0, wethBps: 0 },
    small: { stableBps: 10_000, lpBps: 0, wethBps: 0 },
    mid: { stableBps: 8_000, lpBps: 2_000, wethBps: 0 },
    large: { stableBps: 6_000, lpBps: 3_000, wethBps: 1_000 },
};
/**
 * FIX — DEFAULT_STABLE_SPLIT dipakai sebagai fallback kalau stableSplit
 * tidak dikirim dari runGoalCycle.
 *
 * Sebelum: const STABLE_SPLIT = { usdt: 6_000n, usdc: 3_000n, usdm: 1_000n }
 *          → konstanta statis, tidak pernah berubah meskipun APY berubah.
 *
 * Sesudah: DEFAULT_STABLE_SPLIT hanya sebagai fallback.
 *          Nilai aktual datang dari optimizeAllocation(live APY) via stableSplit input.
 */
const DEFAULT_STABLE_SPLIT = {
    usdt: 6000n,
    usdc: 3000n,
    usdm: 1000n,
};
// ─────────────────────────────────────────────────────────────────────────────
// Swap Routing Rules
// ─────────────────────────────────────────────────────────────────────────────
export function routeSwap(from, to) {
    if (from === "wETH" || to === "wETH")
        return "uniswap";
    const stable = ["USDm", "USDC", "USDT"];
    if (stable.includes(from) && stable.includes(to))
        return "mento";
    return "uniswap";
}
function assertNotMentoWETH(from, to) {
    if ((from === "wETH" || to === "wETH") && routeSwap(from, to) === "mento") {
        throw new Error(`INVARIANT: Mento must never be used to swap into/from WETH`);
    }
}
// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function norm6to18(amount) { return amount * 10n ** 12n; }
function norm18to6(amount) { return amount / 10n ** 12n; }
function portfolioTier(usd) {
    if (usd < 50)
        return "nano";
    if (usd < 200)
        return "small";
    if (usd < 1000)
        return "mid";
    return "large";
}
function currentAllocBps(stableTotal, lpTotal, wethTotal, grand) {
    if (grand === 0n)
        return { stableBps: 10_000, lpBps: 0, wethBps: 0 };
    return {
        stableBps: Number((stableTotal * 10000n) / grand),
        lpBps: Number((lpTotal * 10000n) / grand),
        wethBps: Number((wethTotal * 10000n) / grand),
    };
}
function driftBps(current, target) {
    return Math.abs(current - target);
}
function applySlippage(amount) {
    return (amount * (10000n - SLIPPAGE_BPS)) / 10000n;
}
/**
 * FIX — blendedApy sekarang pakai stableSplit yang dinamis.
 *
 * Sebelum: hardcoded 0.6 * USDT + 0.3 * USDC + 0.1 * USDm
 *          → APY yang dilaporkan tidak akurat kalau split berubah.
 *
 * Sesudah: pakai stableSplit aktual yang dipakai untuk supply
 *          → APY yang dilaporkan = APY yang benar-benar di-earn.
 */
function blendedApy(alloc, apys, stableSplit) {
    const usdtPct = Number(stableSplit.usdt) / 10_000;
    const usdcPct = Number(stableSplit.usdc) / 10_000;
    const usdmPct = Number(stableSplit.usdm) / 10_000;
    const stableApy = apys.usdt * usdtPct + apys.usdc * usdcPct + apys.usdm * usdmPct;
    return (alloc.stableBps / 10_000) * stableApy;
}
// ─────────────────────────────────────────────────────────────────────────────
// Calldata Builders
// ─────────────────────────────────────────────────────────────────────────────
function buildMentoSwapAndSupply(executor, user, fromAddr, toAddr, amountIn, minAmountOut, fromSymbol, toSymbol) {
    assertNotMentoWETH(fromSymbol, toSymbol);
    const minATokens = (minAmountOut * 9900n) / 10000n;
    return {
        to: executor,
        data: encodeFunctionData({
            abi: SENTINEL_EXECUTOR_ABI,
            functionName: "executeMentoSwapAndSupply",
            args: [user, fromAddr, toAddr, amountIn, minAmountOut, minATokens],
        }),
        value: 0n,
        description: `MentoSwapAndSupply ${formatUnits(amountIn, 18)} ${fromSymbol} → ${toSymbol} → Aave`,
    };
}
function buildUniswapSwap(executor, user, fromAddr, toAddr, amountIn, fromSymbol, toSymbol) {
    return {
        to: executor,
        data: encodeFunctionData({
            abi: SENTINEL_EXECUTOR_ABI,
            functionName: "executeUniswapSwap",
            args: [user, fromAddr, toAddr, amountIn, applySlippage(amountIn)],
        }),
        value: 0n,
        description: `Uniswap swap ${formatUnits(amountIn, 18)} ${fromSymbol} → ${toSymbol}`,
    };
}
function buildAaveSupply(executor, user, asset, amount, symbol) {
    return {
        to: executor,
        data: encodeFunctionData({
            abi: SENTINEL_EXECUTOR_ABI,
            functionName: "executeAaveSupply",
            args: [user, asset, amount, applySlippage(amount)],
        }),
        value: 0n,
        description: `Aave supply ${formatUnits(amount, 18)} ${symbol}`,
    };
}
function buildUniswapLP(executor, user, token0, token1, amount0, amount1, totalUSD, portfolioUSD) {
    const amount0Min = (amount0 * 99n) / 100n;
    const amount1Min = (amount1 * 99n) / 100n;
    return {
        to: executor,
        data: encodeFunctionData({
            abi: SENTINEL_EXECUTOR_ABI,
            functionName: "executeUniswapLP",
            args: [user, token0, token1, amount0, amount1, amount0Min, amount1Min, totalUSD, portfolioUSD],
        }),
        value: 0n,
        description: `Uniswap LP ${formatUnits(amount0, 18)} USDC + ${formatUnits(amount1, 18)} WETH`,
    };
}
function buildRebalanceGate(executor, user) {
    return {
        to: executor,
        data: encodeFunctionData({
            abi: SENTINEL_EXECUTOR_ABI,
            functionName: "rebalance",
            args: [user],
        }),
        value: 0n,
        description: "Rebalance gate — record timestamp on-chain",
    };
}
function buildForwardToUser(executor, user, assets) {
    return {
        to: executor,
        data: encodeFunctionData({
            abi: SENTINEL_EXECUTOR_ABI,
            functionName: "forwardToUser",
            args: [user, assets],
        }),
        value: 0n,
        description: `Forward sisa token ke userWallet: ${assets.join(", ")}`,
    };
}
// ─────────────────────────────────────────────────────────────────────────────
// IL Check
// ─────────────────────────────────────────────────────────────────────────────
export function checkIL(positions) {
    const exits = [];
    for (let i = 0; i < positions.tokenIds.length; i++) {
        const entry = positions.entryValues[i] ?? 0n;
        const current = positions.currentValues[i] ?? 0n;
        if (entry === 0n || current >= entry)
            continue;
        const lossBps = Number(((entry - current) * 10000n) / entry);
        if (lossBps >= IL_STOP_LOSS_BPS) {
            exits.push(positions.tokenIds[i]);
            logger.warn("IL stop-loss triggered", {
                tokenId: positions.tokenIds[i],
                lossBps,
                entry: entry.toString(),
                current: current.toString(),
            });
        }
    }
    return exits;
}
// ─────────────────────────────────────────────────────────────────────────────
// Main Strategy Engine
// ─────────────────────────────────────────────────────────────────────────────
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
export async function rebalancePortfolio(input) {
    const { userWallet, executorAddress, balances, aavePositions, uniswapPositions, currentApys, lastRebalancedAt, estimatedGasUSD, wethPriceUSD, } = input;
    const user = userWallet;
    const executor = executorAddress;
    const addr = {
        usdm: getTokenAddress(CHAIN_ID, "USDm"),
        usdc: getTokenAddress(CHAIN_ID, "USDC"),
        usdt: getTokenAddress(CHAIN_ID, "USDT"),
        weth: getTokenAddress(CHAIN_ID, "wETH"),
    };
    // FIX — resolve stableSplit dari input, fallback ke default 60/30/10
    // kalau runGoalCycle tidak mengirimkan hasil optimizeAllocation.
    const stableSplit = input.stableSplit
        ? {
            usdt: BigInt(input.stableSplit.usdt),
            usdc: BigInt(input.stableSplit.usdc),
            usdm: BigInt(input.stableSplit.usdm),
        }
        : DEFAULT_STABLE_SPLIT;
    logger.info("rebalancePortfolio: stable split resolved", {
        wallet: userWallet,
        usdt: `${Number(stableSplit.usdt) / 100}%`,
        usdc: `${Number(stableSplit.usdc) / 100}%`,
        usdm: `${Number(stableSplit.usdm) / 100}%`,
        source: input.stableSplit ? "optimizeAllocation (live APY)" : "default fallback",
    });
    // ── 1. Portfolio valuation (all normalised to 18 dec) ─────────────────────
    const walletStable = (norm6to18(balances.usdc) +
        norm6to18(balances.usdt) +
        balances.usdm);
    const aaveStable = (norm6to18(aavePositions.aUSDC) +
        norm6to18(aavePositions.aUSDT) +
        aavePositions.aUSDm);
    const stableTotal = walletStable + aaveStable;
    const wethPriceFixed = parseUnits(wethPriceUSD.toFixed(18), 18);
    const wethTotal = (balances.weth * wethPriceFixed) / ONE_18;
    const lpTotal = uniswapPositions.currentValues.reduce((acc, v) => acc + v, 0n);
    const grandTotal = stableTotal + wethTotal + lpTotal;
    const portfolioUSD = parseFloat(formatUnits(grandTotal, 18));
    // ── 2. Determine tier ─────────────────────────────────────────────────────
    const tier = portfolioTier(portfolioUSD);
    const targetAlloc = TIER_ALLOCATIONS[tier];
    // ── 3. Guardrail checks ───────────────────────────────────────────────────
    if (portfolioUSD < MIN_REBALANCE_USD) {
        return skip(tier, portfolioUSD, targetAlloc, currentApys, stableSplit, `portfolio $${portfolioUSD.toFixed(2)} below $${MIN_REBALANCE_USD} minimum`);
    }
    if (lastRebalancedAt) {
        const msSince = Date.now() - lastRebalancedAt.getTime();
        if (msSince < REBALANCE_INTERVAL_MS) {
            const hoursLeft = Math.ceil((REBALANCE_INTERVAL_MS - msSince) / 3_600_000);
            return skip(tier, portfolioUSD, targetAlloc, currentApys, stableSplit, `rebalanced recently — next in ${hoursLeft}h`);
        }
    }
    const current = currentAllocBps(stableTotal, lpTotal, wethTotal, grandTotal);
    const maxDrift = Math.max(driftBps(current.stableBps, targetAlloc.stableBps), driftBps(current.lpBps, targetAlloc.lpBps), driftBps(current.wethBps, targetAlloc.wethBps));
    if (maxDrift < DRIFT_THRESHOLD_BPS) {
        return skip(tier, portfolioUSD, targetAlloc, currentApys, stableSplit, `max drift ${(maxDrift / 100).toFixed(1)}% below 10% threshold`);
    }
    // ── 4. IL check ───────────────────────────────────────────────────────────
    const ilExitsRequired = checkIL(uniswapPositions);
    // ── 5. Gas sanity check ───────────────────────────────────────────────────
    const dailyYield = portfolioUSD * (blendedApy(targetAlloc, currentApys, stableSplit) / 100) / 365;
    const gasRatio = (estimatedGasUSD / dailyYield) * 100;
    if (gasRatio > 10) {
        return skip(tier, portfolioUSD, targetAlloc, currentApys, stableSplit, `gas $${estimatedGasUSD.toFixed(3)} = ${gasRatio.toFixed(1)}% of daily yield (max 10%)`);
    }
    // ── 6. Build action calldata ──────────────────────────────────────────────
    const actions = [];
    actions.push(buildRebalanceGate(executor, user));
    const targetStable = (grandTotal * BigInt(targetAlloc.stableBps)) / BPS;
    const targetLP = (grandTotal * BigInt(targetAlloc.lpBps)) / BPS;
    const targetWeth = (grandTotal * BigInt(targetAlloc.wethBps)) / BPS;
    // ── Step 3: stable bucket re-split menggunakan stableSplit DINAMIS ────────
    //
    // FIX: sebelumnya hardcoded STABLE_SPLIT = { usdt: 6000, usdc: 3000, usdm: 1000 }
    // Sekarang pakai stableSplit yang datang dari optimizeAllocation(live APY).
    //
    // Contoh:
    //   USDT APY = 12%, USDC = 3%, USDm = 1%
    //   stableSplit dari optimizeAllocation = { usdt: 7500, usdc: 2000, usdm: 500 }
    //   targetUsdt = targetStable * 75%  (bukan 60% lagi)
    //   targetUsdc = targetStable * 20%  (bukan 30% lagi)
    //   targetUsdm = targetStable * 5%   (bukan 10% lagi)
    const targetUsdt = (targetStable * stableSplit.usdt) / BPS;
    const targetUsdc = (targetStable * stableSplit.usdc) / BPS;
    const targetUsdm = targetStable - targetUsdt - targetUsdc;
    const currentAUsdt = norm6to18(aavePositions.aUSDT);
    const currentAUsdc = norm6to18(aavePositions.aUSDC);
    const currentAUsdm = aavePositions.aUSDm;
    const needUsdt = targetUsdt - currentAUsdt;
    const needUsdc = targetUsdc - currentAUsdc;
    const needUsdm = targetUsdm - currentAUsdm;
    // Supply USDm directly if needed
    if (needUsdm > 0n && balances.usdm >= needUsdm) {
        actions.push(buildAaveSupply(executor, user, addr.usdm, needUsdm, "USDm"));
    }
    // Swap USDm → USDT via Mento + supply ke Aave (atomic)
    if (needUsdt > 0n) {
        const swapAmt18 = needUsdt < balances.usdm ? needUsdt : balances.usdm;
        if (swapAmt18 > 0n) {
            const swapAmt6 = norm18to6(swapAmt18);
            actions.push(buildMentoSwapAndSupply(executor, user, addr.usdm, addr.usdt, swapAmt18, swapAmt6, "USDm", "USDT"));
        }
    }
    // Swap USDm → USDC via Mento + supply ke Aave (atomic)
    if (needUsdc > 0n) {
        const remaining = balances.usdm - (needUsdt > 0n ? needUsdt : 0n);
        const swapAmt18 = needUsdc < remaining ? needUsdc : remaining;
        if (swapAmt18 > 0n) {
            const swapAmt6 = norm18to6(swapAmt18);
            actions.push(buildMentoSwapAndSupply(executor, user, addr.usdm, addr.usdc, swapAmt18, swapAmt6, "USDm", "USDC"));
        }
    }
    // ── Step 4: LP allocation ─────────────────────────────────────────────────
    if (targetAlloc.lpBps > 0 && targetLP > 0n) {
        const lpGap = targetLP - lpTotal;
        if (lpGap > 0n) {
            const lpUsdc18 = lpGap / 2n;
            const lpWeth = lpGap / 2n;
            const lpUsdc6 = norm18to6(lpUsdc18);
            if (norm6to18(balances.usdc) >= lpUsdc18) {
                actions.push(buildUniswapSwap(executor, user, addr.usdc, addr.weth, lpUsdc6, "USDC", "wETH"));
                actions.push(buildUniswapLP(executor, user, addr.usdc, addr.weth, lpUsdc6, lpWeth, lpGap, grandTotal));
                actions.push(buildForwardToUser(executor, user, [addr.usdc, addr.weth]));
            }
        }
    }
    // ── Step 5: WETH allocation ───────────────────────────────────────────────
    if (targetAlloc.wethBps > 0 && targetWeth > wethTotal) {
        const wethNeeded = targetWeth - wethTotal;
        assertNotMentoWETH("USDC", "wETH");
        actions.push(buildUniswapSwap(executor, user, addr.usdc, addr.weth, wethNeeded, "USDC", "wETH"));
    }
    const estApy = blendedApy(targetAlloc, currentApys, stableSplit);
    logger.info("rebalancePortfolio: decision made", {
        wallet: userWallet,
        tier,
        portfolioUSD: portfolioUSD.toFixed(2),
        maxDrift: `${(maxDrift / 100).toFixed(1)}%`,
        actions: actions.length,
        ilExits: ilExitsRequired.length,
        estApy: `${estApy.toFixed(2)}%`,
        target: targetAlloc,
        stableSplit: {
            usdt: `${Number(stableSplit.usdt) / 100}%`,
            usdc: `${Number(stableSplit.usdc) / 100}%`,
            usdm: `${Number(stableSplit.usdm) / 100}%`,
        },
    });
    return {
        shouldRebalance: true,
        tier,
        portfolioUSD,
        targetAlloc,
        actions,
        ilExitsRequired,
        estimatedNewApy: estApy,
        stableSplitUsed: stableSplit,
    };
}
// ─────────────────────────────────────────────────────────────────────────────
// Helper: skip
// ─────────────────────────────────────────────────────────────────────────────
function skip(tier, usd, alloc, apys, stableSplit, reason) {
    logger.info("rebalancePortfolio: skip", { reason, portfolioUSD: usd.toFixed(2) });
    return {
        shouldRebalance: false,
        skipReason: reason,
        tier,
        portfolioUSD: usd,
        targetAlloc: alloc,
        actions: [],
        ilExitsRequired: [],
        estimatedNewApy: blendedApy(alloc, apys, stableSplit),
        stableSplitUsed: stableSplit,
    };
}
