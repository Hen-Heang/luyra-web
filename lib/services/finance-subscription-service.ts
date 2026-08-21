import "server-only";
import { findCategoriesByUser } from "@/lib/repositories/finance-lookup-repository";
import {
  findSubscriptionStatuses,
  upsertSubscriptionStatus,
} from "@/lib/repositories/finance-subscription-repository";
import { findRecurringExpenseGroups } from "@/lib/repositories/finance-transaction-repository";
import type { SetSubscriptionStatusInput } from "@/lib/validation/finance";
import type { DetectedSubscription } from "@/types/finance";

const LOOKBACK_MONTHS = 6;

function average(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function classifyFrequency(dates: string[]): "monthly" | "yearly" | "irregular" {
  if (dates.length < 2) return "irregular";
  const gaps: number[] = [];
  for (let i = 0; i < dates.length - 1; i++) {
    const a = new Date(`${dates[i]}T00:00:00`).getTime();
    const b = new Date(`${dates[i + 1]}T00:00:00`).getTime();
    gaps.push(Math.round((a - b) / (24 * 60 * 60 * 1000)));
  }
  const avgGap = average(gaps);
  if (avgGap >= 25 && avgGap <= 35) return "monthly";
  if (avgGap >= 350 && avgGap <= 380) return "yearly";
  return "irregular";
}

// Detects recurring payments straight from transaction history — simplified
// from Money Flow's merchant-alias-grouping + overlap-detection version:
// groups by exact normalized description only, no fuzzy matching.
export async function listDetectedSubscriptions(userId: string): Promise<DetectedSubscription[]> {
  const since = new Date();
  since.setMonth(since.getMonth() - LOOKBACK_MONTHS);
  const sinceStr = since.toISOString().slice(0, 10);

  const [groups, categories, statuses] = await Promise.all([
    findRecurringExpenseGroups(userId, sinceStr),
    findCategoriesByUser(userId),
    findSubscriptionStatuses(userId),
  ]);

  const categoryById = new Map(categories.map((c) => [c.id, c]));

  return groups.map((group) => {
    const frequency = classifyFrequency(group.dates);
    const avgAmount = average(group.amounts);
    const estimatedYearlyCostKrw =
      frequency === "monthly"
        ? avgAmount * 12
        : frequency === "yearly"
          ? avgAmount
          : avgAmount * (group.occurrenceCount / LOOKBACK_MONTHS) * 12;
    const category = group.categoryId ? categoryById.get(group.categoryId) : undefined;

    return {
      key: group.key,
      name: group.displayName,
      categoryName: category?.name ?? null,
      categoryIcon: category?.icon ?? null,
      categoryColor: category?.color ?? null,
      latestAmountKrw: group.amounts[0],
      averageAmountKrw: Math.round(avgAmount),
      occurrenceCount: group.occurrenceCount,
      lastPaymentDate: group.dates[0],
      frequency,
      estimatedYearlyCostKrw: Math.round(estimatedYearlyCostKrw),
      status: statuses.get(group.key) ?? "review",
    };
  });
}

export async function setSubscriptionStatus(userId: string, key: string, input: SetSubscriptionStatusInput): Promise<void> {
  await upsertSubscriptionStatus(userId, key, input.displayName, input.status);
}
