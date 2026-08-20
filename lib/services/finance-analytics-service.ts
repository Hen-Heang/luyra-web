import "server-only";
import {
  findRecentTransactionsByUser,
  sumExpenseByCategoryForRange,
  sumExpenseByDayForRange,
  sumTotalsForRange,
} from "@/lib/repositories/finance-transaction-repository";
import { findBudgetsByUser } from "@/lib/repositories/finance-budget-repository";
import { findSavingsGoalsByUser } from "@/lib/repositories/finance-savings-repository";
import { computeBudgetPerformance, toBudgetPerformance } from "@/lib/services/finance-budget-service";
import { listDetectedSubscriptions } from "@/lib/services/finance-subscription-service";
import type {
  AnalyticsSummary,
  CategoryComparison,
  DailyBudgetGuide,
  DailySpendingPoint,
  FinanceOverviewSummary,
  MonthTotals,
  ReviewSummary,
} from "@/types/finance";

function monthBounds(month: string): { start: string; end: string } {
  const [year, m] = month.split("-").map(Number);
  const nextYear = m === 12 ? year + 1 : year;
  const nextMonth = m === 12 ? 1 : m + 1;
  return {
    start: `${year}-${String(m).padStart(2, "0")}-01`,
    end: `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`,
  };
}

function previousMonth(month: string): string {
  const [year, m] = month.split("-").map(Number);
  return m === 1 ? `${year - 1}-12` : `${year}-${String(m - 1).padStart(2, "0")}`;
}

function currentSeoulDate(): { date: string; month: string; day: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const month = `${value.year}-${value.month}`;
  return { date: `${month}-${value.day}`, month, day: Number(value.day) };
}

function fillDailySpending(month: string, rows: DailySpendingPoint[]): DailySpendingPoint[] {
  const [year, m] = month.split("-").map(Number);
  const daysInMonth = new Date(Date.UTC(year, m, 0)).getUTCDate();
  const amountByDate = new Map(rows.map((row) => [row.date, row.amountKrw]));

  return Array.from({ length: daysInMonth }, (_, index) => {
    const date = `${month}-${String(index + 1).padStart(2, "0")}`;
    return { date, amountKrw: amountByDate.get(date) ?? 0 };
  });
}

function toDailyBudgetGuide(
  month: string,
  totals: MonthTotals,
  budgetTotalKrw: number,
  dailySpending: DailySpendingPoint[]
): DailyBudgetGuide | null {
  const today = currentSeoulDate();
  if (today.month !== month || budgetTotalKrw <= 0) return null;

  const spentTodayKrw = dailySpending.find((point) => point.date === today.date)?.amountKrw ?? 0;
  const daysRemaining = Math.max(dailySpending.length - today.day + 1, 1);
  const monthlyRemainingKrw = budgetTotalKrw - totals.totalExpenseKrw;
  const availablePerDayKrw = Math.round(monthlyRemainingKrw / daysRemaining);
  const baselinePerDayKrw = budgetTotalKrw / dailySpending.length;
  const status = monthlyRemainingKrw < 0
    ? "over"
    : availablePerDayKrw < baselinePerDayKrw * 0.3
      ? "watch"
      : "healthy";

  return {
    totalBudgetKrw: budgetTotalKrw,
    spentTodayKrw,
    availablePerDayKrw,
    monthlyRemainingKrw,
    daysRemaining,
    status,
  };
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

export async function getFinanceOverviewSummary(userId: string, month: string): Promise<FinanceOverviewSummary> {
  const { start, end } = monthBounds(month);
  const [totalsRaw, categories, dailyRows, budgets, recentTransactions] = await Promise.all([
    sumTotalsForRange(userId, start, end),
    sumExpenseByCategoryForRange(userId, start, end),
    sumExpenseByDayForRange(userId, start, end),
    findBudgetsByUser(userId),
    findRecentTransactionsByUser(userId, start, end),
  ]);
  const totals = toMonthTotals(totalsRaw);
  const dailySpending = fillDailySpending(month, dailyRows);
  const budgetPerformance = toBudgetPerformance(budgets, categories);
  const budgetTotalKrw = budgetPerformance.reduce((sum, budget) => sum + budget.budgetKrw, 0);

  return {
    month,
    totals,
    categories,
    dailySpending,
    dailyBudget: toDailyBudgetGuide(month, totals, budgetTotalKrw, dailySpending),
    budgetPerformance,
    recentTransactions,
  };
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
