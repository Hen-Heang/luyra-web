import "server-only";
import { sumExpenseByCategoryForRange, sumTotalsForRange } from "@/lib/repositories/finance-transaction-repository";
import { findSavingsGoalsByUser } from "@/lib/repositories/finance-savings-repository";
import { computeBudgetPerformance } from "@/lib/services/finance-budget-service";
import { listDetectedSubscriptions } from "@/lib/services/finance-subscription-service";
import type { AnalyticsSummary, CategoryComparison, MonthTotals, ReviewSummary } from "@/types/finance";

function monthBounds(month: string): { start: string; end: string } {
  const [year, m] = month.split("-").map(Number);
  const toDateStr = (d: Date) => d.toISOString().slice(0, 10);
  return { start: toDateStr(new Date(year, m - 1, 1)), end: toDateStr(new Date(year, m, 1)) };
}

function previousMonth(month: string): string {
  const [year, m] = month.split("-").map(Number);
  const date = new Date(year, m - 2, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function toMonthTotals(raw: { incomeKrw: number; expenseKrw: number; count: number }): MonthTotals {
  const net = raw.incomeKrw - raw.expenseKrw;
  const savingsRatePct = raw.incomeKrw > 0 ? Math.round((net / raw.incomeKrw) * 100) : 0;
  return {
    totalIncomeKrw: raw.incomeKrw,
    totalExpenseKrw: raw.expenseKrw,
    netCashFlowKrw: net,
    savingsRatePct,
    transactionCount: raw.count,
  };
}

export async function getAnalyticsSummary(userId: string, month: string): Promise<AnalyticsSummary> {
  const { start, end } = monthBounds(month);
  const [totalsRaw, categories] = await Promise.all([
    sumTotalsForRange(userId, start, end),
    sumExpenseByCategoryForRange(userId, start, end),
  ]);

  return { month, totals: toMonthTotals(totalsRaw), categories };
}

export async function getReviewSummary(userId: string, month: string): Promise<ReviewSummary> {
  const { start, end } = monthBounds(month);
  const prevMonth = previousMonth(month);
  const { start: prevStart, end: prevEnd } = monthBounds(prevMonth);

  const [totalsRaw, prevTotalsRaw, categories, prevCategories, budgetPerformance, subscriptions, savingsGoals] =
    await Promise.all([
      sumTotalsForRange(userId, start, end),
      sumTotalsForRange(userId, prevStart, prevEnd),
      sumExpenseByCategoryForRange(userId, start, end),
      sumExpenseByCategoryForRange(userId, prevStart, prevEnd),
      computeBudgetPerformance(userId, start, end),
      listDetectedSubscriptions(userId),
      findSavingsGoalsByUser(userId),
    ]);

  const prevByCategory = new Map(prevCategories.map((c) => [c.categoryId ?? c.categoryName, c.amountKrw]));
  const categoryComparison: CategoryComparison[] = categories.map((c) => {
    const previousKrw = prevByCategory.get(c.categoryId ?? c.categoryName) ?? 0;
    return {
      categoryId: c.categoryId,
      categoryName: c.categoryName,
      currentKrw: c.amountKrw,
      previousKrw,
      deltaKrw: c.amountKrw - previousKrw,
    };
  });

  const subscriptionsMonthlyKrw = subscriptions
    .filter((s) => s.status !== "cancelled")
    .reduce((sum, s) => sum + Math.round(s.estimatedYearlyCostKrw / 12), 0);

  return {
    month,
    totals: toMonthTotals(totalsRaw),
    previousTotals: toMonthTotals(prevTotalsRaw),
    categoryComparison,
    budgetPerformance,
    subscriptionsMonthlyKrw,
    savingsGoalsCount: savingsGoals.length,
  };
}
