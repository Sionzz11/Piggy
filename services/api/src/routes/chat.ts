import type { FastifyInstance } from "fastify";
import { x402PaymentGate } from "../middleware/x402.js";
import { getActiveGoalByOwner, insertNotification, getTelegramChatId, db, chatCounts } from "@piggy/db";
import { eq, and, sql } from "drizzle-orm";
import { logger } from "@piggy/shared";
import { FREE_CHAT_LIMIT_PER_MONTH } from "@piggy/shared";
import { getCurrentApy } from "@piggy/adapters/aave.js";
import { analyzeGoalFeasibility } from "@piggy/agent/intelligence/goalFeasibility.js";
import { trackPace } from "@piggy/agent/intelligence/paceTracking.js";

function getCurrentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()}`;
}

async function getChatCount(wallet: string): Promise<number> {
  const month = getCurrentMonth();
  try {
    const row = await db
      .select({ count: chatCounts.count })
      .from(chatCounts)
      .where(and(eq(chatCounts.wallet, wallet), eq(chatCounts.month, month)))
      .limit(1)
      .then(r => r[0]);
    return row?.count ?? 0;
  } catch {
    return 0;
  }
}

async function incrementChatCount(wallet: string): Promise<void> {
  const month = getCurrentMonth();
  try {
    await db
      .insert(chatCounts)
      .values({ wallet, month, count: 1 })
      .onConflictDoUpdate({
        target: [chatCounts.wallet, chatCounts.month],
        set:    { count: sql`${chatCounts.count} + 1`, updatedAt: new Date() },
      });
  } catch (err) {
    logger.warn("incrementChatCount failed", err as object);
  }
}

function buildUsageFooter(countBefore: number): string | null {
  const remaining = FREE_CHAT_LIMIT_PER_MONTH - countBefore - 1;
  if (countBefore === FREE_CHAT_LIMIT_PER_MONTH - 3)
    return `_💬 ${remaining} free messages left this month._`;
  if (countBefore === FREE_CHAT_LIMIT_PER_MONTH - 2)
    return `_💬 ${remaining} free message left this month. After that, 0.01 USDC/message._`;
  if (countBefore === FREE_CHAT_LIMIT_PER_MONTH - 1)
    return `_💬 Last free message this month. After this, 0.01 USDC/message 🐷_`;
  if (countBefore >= FREE_CHAT_LIMIT_PER_MONTH)
    return `_💳 0.01 USDC charged for this message._`;
  return null;
}

interface ChatMessage {
  role:    "user" | "assistant";
  content: string;
}

function buildSystemPrompt(goalContext: string): string {
  return [
    "You are Penny 🐷 — a personal AI savings guardian inside Piggy Sentinel, a DeFi savings app on Celo blockchain.",
    "",
    "## Who you are",
    "You are an autonomous agent working 24/7 — every 6 hours you check market conditions, evaluate risk, and rebalance the user's portfolio across Aave stablecoin pools (USDT ~8-9% APY, USDC ~2-3%, USDm ~1%). User funds always stay in their wallet; you only optimize yield within the spend limit they approved on-chain.",
    "You genuinely care about users reaching their goals. You celebrate milestones and give honest, specific advice when they are falling behind.",
    "",
    "## CRITICAL: Language detection",
    "Detect the language the user is writing in and ALWAYS respond in that EXACT same language.",
    "- User writes in Indonesian -> respond in Indonesian. Use casual everyday Indonesian: 'kamu', 'aku', 'nih', 'sih', 'dong', 'banget'. NEVER use formal 'Anda' or 'saya'.",
    "- User writes in English -> respond in English, warm and casual.",
    "- User writes in another language -> respond in that language.",
    "- Never switch languages mid-response.",
    "",
    "## Personality and tone",
    "- Warm, friendly like a knowledgeable friend",
    "- Casual, natural — no corporate language",
    "- Concise but complete: 3-5 sentences for simple questions, up to 8 for detailed analysis",
    "- Bold key numbers: **$12.50**, **6.8%**, **42 days**",
    "- Light emojis: 🐷 ✨ 📈 💰 — do not overdo it",
    "- Acknowledge feelings first before giving advice",
    "",
    "## What you CAN help with",
    "- Detailed goal progress analysis with specific projections",
    "- Exact date when goal will be reached at current pace",
    "- How much extra monthly deposit would fix a shortfall",
    "- Why a rebalance happened and what it means in dollars",
    "- Risk scores, circuit breaker events, APY changes",
    "- Motivation and accountability when behind pace",
    "- DeFi concepts explained simply",
    "- Fee structure: 5% of yield only goes to disability causes. Principal is NEVER touched.",
    "",
    "## What you CANNOT do",
    "- Give specific investment advice",
    "- Promise guaranteed returns — always say 'estimated' or 'projected'",
    "- Discuss topics outside savings/Piggy Sentinel",
    "- Execute transactions via chat",
    "",
    "## Current user context",
    goalContext,
  ].join("\n");
}

async function buildGoalContext(wallet: string): Promise<string> {
  try {
    const goal = await getActiveGoalByOwner(wallet);
    if (!goal) {
      return "User has no active savings goal yet. Warmly encourage them to set one — it only takes 2 minutes and funds stay in their wallet at all times.";
    }

    const deadline      = new Date(goal.deadline);
    const goalStart     = new Date(goal.createdAt ?? Date.now());
    const now           = Date.now();
    const daysLeft      = Math.ceil((deadline.getTime() - now) / 86_400_000);
    const daysElapsed   = Math.ceil((now - goalStart.getTime()) / 86_400_000);
    const monthsLeft    = Math.max(0.1, daysLeft / 30.44);
    const monthsElapsed = Math.max(0, (now - goalStart.getTime()) / (30.44 * 24 * 3600 * 1000));
    const totalMonths   = monthsLeft + monthsElapsed;

    const progress    = goal.progressPct    != null ? parseFloat(goal.progressPct)    : 0;
    const targetUSD   = Number(goal.targetAmount) / 1e18;
    const currentUSD  = targetUSD * (progress / 100);
    const principal   = Number(goal.principalDeposited ?? 0) / 1e18;
    const yieldEarned = Math.max(0, currentUSD - principal);
    const remaining   = Math.max(0, targetUSD - currentUSD);
    const monthlyDep  = Number(goal.monthlyDeposit ?? 0) / 1e18;
    const goalName    = goal.goalName ?? "Savings Goal";

    const [apyUsdm, apyUsdc, apyUsdt] = await Promise.allSettled([
      getCurrentApy("USDm").catch(() => null),
      getCurrentApy("USDC").catch(() => null),
      getCurrentApy("USDT").catch(() => null),
    ]);
    const apy = {
      usdm: apyUsdm.status === "fulfilled" ? (apyUsdm.value ?? 1.07) : 1.07,
      usdc: apyUsdc.status === "fulfilled" ? (apyUsdc.value ?? 2.61) : 2.61,
      usdt: apyUsdt.status === "fulfilled" ? (apyUsdt.value ?? 8.89) : 8.89,
    };
    const blendedApy    = apy.usdt * 0.6 + apy.usdc * 0.3 + apy.usdm * 0.1;
    const blendedApyDec = blendedApy / 100;

    let feasibility: ReturnType<typeof analyzeGoalFeasibility> | null = null;
    try {
      feasibility = analyzeGoalFeasibility({
        currentBalance:        currentUSD,
        goalAmount:            targetUSD,
        timeHorizonMonths:     monthsLeft,
        expectedAPY:           blendedApyDec,
        plannedMonthlyDeposit: monthlyDep,
      });
    } catch {}

    let pace: ReturnType<typeof trackPace> | null = null;
    try {
      pace = trackPace({
        currentBalance:  currentUSD,
        startingBalance: principal > 0 ? principal : currentUSD,
        goalAmount:      targetUSD,
        monthsElapsed,
        totalMonths,
        expectedAPY:     blendedApyDec,
        monthlyDeposit:  monthlyDep,
      });
    } catch {}

    let projectedDaysToGoal: number | null = null;
    if (remaining <= 0) {
      projectedDaysToGoal = 0;
    } else if (blendedApyDec > 0) {
      const monthlyRate = blendedApyDec / 12;
      let balance = currentUSD;
      let months  = 0;
      while (balance < targetUSD && months < 600) {
        balance = balance * (1 + monthlyRate) + monthlyDep;
        months++;
      }
      projectedDaysToGoal = months < 600 ? Math.round(months * 30.44) : null;
    }

    let requiredMonthlyExtra: number | null = null;
    if (remaining > 0 && monthsLeft > 0.5) {
      const monthlyRate  = blendedApyDec / 12;
      const growthFactor = Math.pow(1 + monthlyRate, monthsLeft);
      const pvGrown      = currentUSD * growthFactor;
      if (targetUSD > pvGrown) {
        const annuityFactor = monthlyRate > 0 ? (growthFactor - 1) / monthlyRate : monthsLeft;
        requiredMonthlyExtra = Math.max(0, (targetUSD - pvGrown) / annuityFactor - monthlyDep);
      }
    }

    const projLine = projectedDaysToGoal === 0
      ? "Projected: GOAL ALREADY REACHED"
      : projectedDaysToGoal !== null
        ? "Projected completion: ~" + projectedDaysToGoal + " days from now (" + (
            projectedDaysToGoal <= daysLeft
              ? (daysLeft - projectedDaysToGoal) + " days BEFORE deadline"
              : (projectedDaysToGoal - daysLeft) + " days AFTER deadline"
          ) + ")"
        : "Projected: cannot reach goal at current pace";

    const topupLine = requiredMonthlyExtra !== null && requiredMonthlyExtra > 0.5
      ? "To hit deadline on time: needs +$" + requiredMonthlyExtra.toFixed(2) + "/month more"
      : requiredMonthlyExtra !== null && requiredMonthlyExtra <= 0.5
        ? "On track for deadline"
        : "";

    const lines = [
      "=== GOAL: \"" + goalName + "\" ===",
      "Status: " + goal.status + (goal.softPaused ? " (paused by user)" : ""),
      "",
      "PROGRESS",
      "Target: $" + targetUSD.toFixed(2) + " USDm",
      "Current: $" + currentUSD.toFixed(2) + " (" + progress.toFixed(1) + "%)",
      "Principal deposited: $" + principal.toFixed(2),
      "Yield earned: +$" + yieldEarned.toFixed(2) + (principal > 0 ? " (" + ((yieldEarned / principal) * 100).toFixed(2) + "% return)" : ""),
      "Still needed: $" + remaining.toFixed(2),
      "",
      "TIMELINE",
      "Started: " + daysElapsed + " days ago",
      "Deadline: " + deadline.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) + " (" + daysLeft + " days left)",
      projLine,
      monthlyDep > 0 ? "Monthly deposit: $" + monthlyDep.toFixed(2) + "/month" : "Monthly deposit: none",
      topupLine,
      "",
      "LIVE APY (Aave, Celo mainnet)",
      "USDT: " + apy.usdt.toFixed(2) + "% | USDC: " + apy.usdc.toFixed(2) + "% | USDm: " + apy.usdm.toFixed(2) + "%",
      "Blended (60/30/10): ~" + blendedApy.toFixed(2) + "%",
      "",
      "PACE",
      pace ? "Status: " + pace.paceStatus.replace(/_/g, " ") : "Status: unknown",
      pace ? "Detail: " + pace.message : "",
      feasibility ? "Feasibility: " + feasibility.verdict : "",
      feasibility ? "Projected value (APY only): $" + feasibility.projectedValueFromBalance.toFixed(2) : "",
      feasibility ? "Achievable with current balance: " + (feasibility.achievableWithBalance ? "YES" : "NO — needs more deposits") : "",
      "",
      "FEE",
      "5% of yield only — donated to disability causes. Principal is NEVER touched.",
    ];

    return lines.filter(Boolean).join("\n");
  } catch (err) {
    logger.warn("buildGoalContext failed", err as object);
    return "Goal context temporarily unavailable. Answer generally about Piggy Sentinel.";
  }
}

async function callClaude(
  userMessage: string,
  goalContext: string,
  history: ChatMessage[],
): Promise<string> {
  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) {
    logger.warn("CLAUDE_API_KEY not set — returning mock response");
    return "Hi! I'm Penny 🐷 — CLAUDE_API_KEY is not configured on this server.";
  }

  const systemPrompt = buildSystemPrompt(goalContext);

  const messages: { role: "user" | "assistant"; content: string }[] = [
    ...history.slice(-6),
    { role: "user", content: userMessage },
  ];

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method:  "POST",
    headers: {
      "Content-Type":      "application/json",
      "x-api-key":         apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model:      process.env.CLAUDE_MODEL ?? "claude-sonnet-4-20250514",
      max_tokens: 600,
      system:     systemPrompt,
      messages,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error("Claude API error: " + response.status + " " + err);
  }

  const data = await response.json() as { content: { type: string; text: string }[] };
  return data.content.find(b => b.type === "text")?.text ?? "Sorry, something went wrong.";
}

export async function chatRoutes(app: FastifyInstance) {

  app.post<{
    Body: { wallet: string; message: string; history?: ChatMessage[] }
  }>("/", async (req, reply) => {
    const { wallet, message, history = [] } = req.body;

    if (!wallet || !message) {
      return reply.code(400).send({ error: "wallet and message required" });
    }

    const countBefore = await getChatCount(wallet);
    const isPaid      = countBefore >= FREE_CHAT_LIMIT_PER_MONTH;

    if (isPaid) {
      const paymentHeader = req.headers["x-payment"] as string | undefined;
      if (paymentHeader) {
        await x402PaymentGate(req, reply);
        if (reply.sent) return;
      } else if (process.env.TREASURY_ADDRESS) {
        return reply.code(402).send({
          error: "Payment Required",
          x402: {
            scheme:   "exact",
            network:  "eip155:42220",
            asset:    process.env.NEXT_PUBLIC_USDC_ADDRESS ?? "USDC",
            payTo:    process.env.TREASURY_ADDRESS,
            amount:   "0.01",
            decimals: 6,
            memo:     "piggy-sentinel-chat",
          },
          message: "You've used all free messages. Send 0.01 USDC to continue.",
        });
      }
    }

    const goalContext = await buildGoalContext(wallet);

    try {
      const answer = await callClaude(message, goalContext, history);
      incrementChatCount(wallet);

      const usageFooter = buildUsageFooter(countBefore);

      if (isPaid) {
        try {
          const activeGoal = await getActiveGoalByOwner(wallet);
          if (activeGoal) {
            const chatId = await getTelegramChatId(wallet);
            if (chatId) {
              await insertNotification({
                goalId:         activeGoal.id,
                telegramChatId: chatId,
                type:           "x402_charged",
                messageText:    "*Piggy Sentinel* 💳\n\nA micropayment of 0.01 USDC was charged for your Penny message.\n\nAll free messages used this month. Each additional message: 0.01 USDC — still cheaper than a financial advisor 🐷",
              });
            }
          }
        } catch (err) {
          logger.warn("x402 Telegram notification failed", err as object);
        }
      }

      return {
        answer,
        usageFooter,
        chatCount: await getChatCount(wallet),
        freeLimit: FREE_CHAT_LIMIT_PER_MONTH,
        remaining: Math.max(0, FREE_CHAT_LIMIT_PER_MONTH - (await getChatCount(wallet))),
        isPaid,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error("Claude API failed", msg);
      return reply.code(500).send({ error: "AI service temporarily unavailable." });
    }
  });

  app.get<{ Querystring: { wallet: string } }>("/limit", async (req, reply) => {
    const { wallet } = req.query;
    if (!wallet) return reply.code(400).send({ error: "wallet required" });
    const count = await getChatCount(wallet);
    return {
      used:       count,
      freeLimit:  FREE_CHAT_LIMIT_PER_MONTH,
      remaining:  Math.max(0, FREE_CHAT_LIMIT_PER_MONTH - count),
      isPaidTier: count >= FREE_CHAT_LIMIT_PER_MONTH,
    };
  });
}
