import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { computeBudgetPerformance } from "@/lib/services/finance-budget-service";
import {
  findPushBudgetAlertStatus,
  listPushSubscriptionsForUser,
  listUsersWithPushSubscriptions,
  upsertPushBudgetAlertStatus,
  type PushBudgetAlertStatus,
} from "@/lib/repositories/push-subscription-repository";
import {
  isPushNotificationConfigured,
  sendPushNotification,
} from "@/lib/services/push-notification-service";

export const runtime = "nodejs";

const STATUS_RANK: Record<PushBudgetAlertStatus, number> = {
  watch: 1,
  near_limit: 2,
  exceeded: 3,
};

const STATUS_COPY: Record<PushBudgetAlertStatus, string> = {
  watch: "is getting close to its monthly budget",
  near_limit: "is near its monthly budget",
  exceeded: "has exceeded its monthly budget",
};

function authorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const actual = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

function currentUtcMonth(): { monthKey: string; start: string; end: string } {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const nextMonth = new Date(Date.UTC(year, month + 1, 1));
  const start = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const end = `${nextMonth.getUTCFullYear()}-${String(nextMonth.getUTCMonth() + 1).padStart(2, "0")}-01`;
  return { monthKey: start.slice(0, 7), start, end };
}

export async function GET(request: NextRequest) {
  if (!process.env.CRON_SECRET) {
    console.error("Push budget cron is disabled because CRON_SECRET is not configured.");
    return NextResponse.json({ error: "Cron is not configured" }, { status: 503 });
  }
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isPushNotificationConfigured()) {
    return NextResponse.json({ error: "Push notifications are not configured" }, { status: 503 });
  }

  const { monthKey, start, end } = currentUtcMonth();
  const userIds = await listUsersWithPushSubscriptions();
  let notificationsSent = 0;
  let staleSubscriptionsRemoved = 0;
  let errors = 0;

  for (const userId of userIds) {
    try {
      const [budgets, subscriptions] = await Promise.all([
        computeBudgetPerformance(userId, start, end),
        listPushSubscriptionsForUser(userId),
      ]);

      for (const budget of budgets) {
        if (budget.status === "ok") continue;
        const status = budget.status as PushBudgetAlertStatus;
        const previousStatus = await findPushBudgetAlertStatus(userId, budget.categoryId, monthKey);
        if (previousStatus && STATUS_RANK[status] <= STATUS_RANK[previousStatus]) continue;

        let sentForAlert = false;
        for (const subscription of subscriptions) {
          try {
            const result = await sendPushNotification(subscription, {
              title: "Budget alert",
              body: `${budget.categoryName} ${STATUS_COPY[status]} (${budget.usagePct}% used).`,
              tag: `budget-${budget.categoryId}-${monthKey}-${status}`,
              data: { url: "/finance/budgets" },
            });
            if (result.sent) {
              notificationsSent += 1;
              sentForAlert = true;
            }
            if (result.staleRemoved) staleSubscriptionsRemoved += 1;
          } catch (error) {
            errors += 1;
            console.error("Push delivery failed", {
              userId,
              categoryId: budget.categoryId,
              status,
              error: error instanceof Error ? error.message : "Unknown push error",
            });
          }
        }

        if (sentForAlert) {
          await upsertPushBudgetAlertStatus(userId, budget.categoryId, monthKey, status);
        }
      }
    } catch (error) {
      errors += 1;
      console.error("Push budget alert processing failed", {
        userId,
        error: error instanceof Error ? error.message : "Unknown processing error",
      });
    }
  }

  return NextResponse.json({
    monthKey,
    usersChecked: userIds.length,
    notificationsSent,
    staleSubscriptionsRemoved,
    errors,
  });
}
