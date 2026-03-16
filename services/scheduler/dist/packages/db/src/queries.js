// ─────────────────────────────────────────────────────────────────────────────
// @piggy/db — Query Functions
// ─────────────────────────────────────────────────────────────────────────────
import { eq, and, isNull, desc, lt, or, sql } from "drizzle-orm";
import { db } from "./client.js";
import { users, agentWallets, goals, executions, agentEvents, snapshots, notifications, telegramLinks, usedPayments, } from "./schema.js";
// ─────────────────────────────────────────────────────────────────────────────
// Users
// ─────────────────────────────────────────────────────────────────────────────
export async function upsertUser(walletAddress) {
    await db.insert(users).values({ walletAddress }).onConflictDoNothing();
}
// ─────────────────────────────────────────────────────────────────────────────
// Agent Wallets
// ─────────────────────────────────────────────────────────────────────────────
export async function upsertAgentWallet(input) {
    await db
        .insert(agentWallets)
        .values({
        contractAddress: input.contractAddress,
        ownerWallet: input.ownerWallet,
        executorAddress: input.executorAddress,
        spendLimit: input.spendLimit.toString(),
    })
        .onConflictDoUpdate({
        target: agentWallets.contractAddress,
        set: {
            executorAddress: input.executorAddress,
            spendLimit: input.spendLimit.toString(),
            updatedAt: new Date(),
        },
    });
}
// ─────────────────────────────────────────────────────────────────────────────
// Goals
// ─────────────────────────────────────────────────────────────────────────────
export async function createGoal(input) {
    return db
        .insert(goals)
        .values({
        ownerWallet: input.ownerWallet,
        agentWallet: input.agentWallet,
        targetAmount: input.targetAmount.toString(),
        targetCurrency: input.targetCurrency,
        deadline: input.deadlineDate,
        status: "draft",
        goalName: input.goalName ?? null,
        strategyJson: input.strategyJson ?? null,
        epochStart: new Date(),
    })
        .returning();
}
export async function getGoalById(id) {
    const rows = await db.select().from(goals).where(eq(goals.id, id)).limit(1);
    return rows[0];
}
export async function getActiveGoalByOwner(walletAddress) {
    const rows = await db
        .select()
        .from(goals)
        .where(and(eq(goals.ownerWallet, walletAddress), or(eq(goals.status, "active"), eq(goals.status, "action_required"))))
        .orderBy(desc(goals.createdAt)); // B5 FIX: hapus .limit(1) — return yang terbaru
    return rows[0]; // caller tetap dapat satu goal (yang paling baru)
}
export async function getAllActiveGoals() {
    return db
        .select()
        .from(goals)
        .where(or(eq(goals.status, "active"), eq(goals.status, "action_required")));
}
export async function updateGoalStatus(id, status) {
    await db.update(goals).set({ status, updatedAt: new Date() }).where(eq(goals.id, id));
}
/**
 * Mark goal as action_required with a reason.
 * Agent stops executing but goal is not deleted.
 */
export async function setGoalActionRequired(id, reason) {
    await db
        .update(goals)
        .set({ status: "action_required", actionReason: reason, softPaused: true, updatedAt: new Date() })
        .where(eq(goals.id, id));
}
/**
 * Clear action_required — restore to active after user resolves the issue.
 */
export async function clearGoalActionRequired(id) {
    await db
        .update(goals)
        .set({ status: "active", actionReason: null, softPaused: false, updatedAt: new Date() })
        .where(eq(goals.id, id));
}
export async function setSoftPausedByOwner(walletAddress, softPaused) {
    await db
        .update(goals)
        .set({ softPaused, updatedAt: new Date() })
        .where(eq(goals.ownerWallet, walletAddress));
}
/**
 * A2 FIX: scope soft-pause ke satu goal ID, bukan semua goal milik wallet.
 * Versi lama setSoftPausedByOwner update semua goal wallet — kalau user
 * punya lebih dari 1 goal, pause satu goal akan pause semua sekaligus.
 */
export async function setSoftPausedById(goalId, softPaused) {
    await db
        .update(goals)
        .set({ softPaused, updatedAt: new Date() })
        .where(eq(goals.id, goalId));
}
export async function updateGoalAfterCycle(id, progressPct, didRebalance, blendedApy) {
    const setCols = {
        progressPct: progressPct.toFixed(2),
        lastRebalancedAt: didRebalance ? new Date() : undefined,
        lastAllowanceCheck: new Date(),
        updatedAt: new Date(),
    };
    // Simpan APY terakhir saat rebalance ke strategyJson
    // Dipakai oleh decisionEngine untuk hitung drift dari nilai nyata
    if (didRebalance && blendedApy !== undefined) {
        const current = await db
            .select({ strategyJson: goals.strategyJson })
            .from(goals)
            .where(eq(goals.id, id))
            .then(r => r[0]?.strategyJson ?? {});
        setCols.strategyJson = { ...current, lastBlendedApy: blendedApy };
    }
    await db
        .update(goals)
        .set(setCols)
        .where(eq(goals.id, id));
}
export async function getRecentHistory(walletAddress) {
    const userGoals = await db
        .select()
        .from(goals)
        .where(eq(goals.ownerWallet, walletAddress))
        .orderBy(desc(goals.createdAt))
        .limit(10);
    const goalIds = userGoals.map(g => g.id);
    if (goalIds.length === 0)
        return { goals: userGoals, executions: [] };
    const recentExecs = [];
    for (const goalId of goalIds.slice(0, 3)) {
        const execs = await db
            .select()
            .from(executions)
            .where(eq(executions.goalId, goalId))
            .orderBy(desc(executions.createdAt))
            .limit(5);
        recentExecs.push(...execs);
    }
    return { goals: userGoals, executions: recentExecs };
}
// ─────────────────────────────────────────────────────────────────────────────
// Executions
// ─────────────────────────────────────────────────────────────────────────────
export async function insertExecution(input) {
    const rows = await db.insert(executions).values(input).returning({ id: executions.id });
    return rows[0].id;
}
export async function updateExecution(id, status, txHash) {
    await db
        .update(executions)
        .set({ status, txHash: txHash ?? null, updatedAt: new Date() })
        .where(eq(executions.id, id));
}
// ─────────────────────────────────────────────────────────────────────────────
// Agent Events
// ─────────────────────────────────────────────────────────────────────────────
export async function insertAgentEvent(input) {
    await db.insert(agentEvents).values({
        goalId: input.goalId,
        agentWallet: input.agentWallet,
        status: input.status,
        reason: input.reason ?? null,
    });
}
export async function getLatestAgentEvent(goalId) {
    const rows = await db
        .select()
        .from(agentEvents)
        .where(eq(agentEvents.goalId, goalId))
        .orderBy(desc(agentEvents.cycleAt))
        .limit(1);
    return rows[0];
}
export async function getRecentAgentEvents(goalId, limit = 10) {
    return db
        .select()
        .from(agentEvents)
        .where(eq(agentEvents.goalId, goalId))
        .orderBy(desc(agentEvents.cycleAt))
        .limit(limit);
}
// ─────────────────────────────────────────────────────────────────────────────
// Snapshots
// ─────────────────────────────────────────────────────────────────────────────
export async function insertSnapshot(goalId, balance, progressPct, paceStatus) {
    await db.insert(snapshots).values({
        goalId,
        balance: balance.toString(),
        progressPct: progressPct.toFixed(2),
        paceStatus,
    });
}
// ─────────────────────────────────────────────────────────────────────────────
// Notifications
// ─────────────────────────────────────────────────────────────────────────────
export async function insertNotification(input) {
    await db.insert(notifications).values({
        goalId: input.goalId,
        telegramChatId: input.telegramChatId,
        notificationType: input.type,
        messageText: input.messageText,
    });
}
export async function getPendingNotifications() {
    return db
        .select()
        .from(notifications)
        .where(eq(notifications.sent, false))
        .orderBy(notifications.createdAt)
        .limit(50);
}
export async function markNotificationSent(id) {
    await db.update(notifications).set({ sent: true, sentAt: new Date() }).where(eq(notifications.id, id));
}
// ─────────────────────────────────────────────────────────────────────────────
// Telegram Links
// ─────────────────────────────────────────────────────────────────────────────
export async function createTelegramLink(walletAddress, code, expiresAt) {
    await db.insert(telegramLinks).values({ walletAddress, code, expiresAt }).onConflictDoNothing();
}
export async function confirmTelegramLink(code, chatId) {
    const now = new Date();
    return db
        .update(telegramLinks)
        .set({ chatId, confirmedAt: now })
        .where(and(eq(telegramLinks.code, code), isNull(telegramLinks.confirmedAt), lt(telegramLinks.expiresAt, sql.raw("now()"))))
        .returning();
}
export async function getTelegramChatId(walletAddress) {
    const rows = await db
        .select({ chatId: telegramLinks.chatId })
        .from(telegramLinks)
        .where(and(eq(telegramLinks.walletAddress, walletAddress), eq(telegramLinks.chatId, telegramLinks.chatId)))
        .orderBy(desc(telegramLinks.confirmedAt))
        .limit(1);
    return rows[0]?.chatId ?? null;
}
export async function getWalletForChatId(chatId) {
    const rows = await db
        .select({ walletAddress: telegramLinks.walletAddress })
        .from(telegramLinks)
        .where(eq(telegramLinks.chatId, chatId))
        .orderBy(desc(telegramLinks.confirmedAt))
        .limit(1);
    return rows[0]?.walletAddress ?? null;
}
// ─────────────────────────────────────────────────────────────────────────────
// x402 Payment Replay Protection
// ─────────────────────────────────────────────────────────────────────────────
export async function isPaymentUsed(txHash) {
    const rows = await db
        .select({ txHash: usedPayments.txHash })
        .from(usedPayments)
        .where(eq(usedPayments.txHash, txHash))
        .limit(1);
    return rows.length > 0;
}
/**
 * B1 FIX — Atomic replay protection.
 *
 * Versi lama: isPaymentUsed() → verify → markPaymentUsed()
 *   Dua concurrent request lolos cek pertama sebelum salah satunya mark DB.
 *
 * Versi baru: markPaymentUsed() sebagai atomic lock via INSERT ... ON CONFLICT.
 *   - Kalau INSERT berhasil  → return true  (request ini yang berhak)
 *   - Kalau INSERT conflict  → return false (sudah dipakai, tolak)
 *   PostgreSQL INSERT adalah atomic — tidak ada race condition.
 *
 * isPaymentUsed() tetap ada untuk keperluan audit/read-only.
 */
export async function markPaymentUsed(txHash, payerAddress, amountUsdc) {
    const result = await db
        .insert(usedPayments)
        .values({ txHash, payerAddress, amountUsdc: amountUsdc.toFixed(6) })
        .onConflictDoNothing()
        .returning({ txHash: usedPayments.txHash });
    // returning() returns the inserted row only if INSERT succeeded (not on conflict)
    return result.length > 0;
}
