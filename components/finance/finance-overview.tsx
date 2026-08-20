"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Clock3,
  Landmark,
  PiggyBank,
  ReceiptText,
  Scale,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  CategoryIcon,
  FinanceEmptyState,
  FinanceErrorState,
  FinanceMetricCard,
  FinanceProgress,
  FinanceSection,
  MonthSelector,
} from "@/components/finance/ui/finance-primitives";
import { getFinanceOverview } from "@/lib/api/finance";
import { krw } from "@/lib/finance-format";
import { monthKey, monthLabel } from "@/lib/finance-month";
import { cn } from "@/lib/utils";
import type {
  BudgetPerformance,
  CategoryAmount,
  DailyBudgetGuide,
  DailySpendingPoint,
  FinanceOverviewSummary,
  Transaction,
} from "@/types/finance";

function signedAmount(value: number): string {
  if (value > 0) return `+${krw.format(value)}`;
  return krw.format(value);
}

function transactionAmount(transaction: Transaction): string {
  const prefix = transaction.type === "income" ? "+" : "−";
  return `${prefix}${krw.format(transaction.amountKrw)}`;
}

function formatTransactionDate(transaction: Transaction): string {
  const date = new Date(`${transaction.date}T00:00:00`);
  const dateLabel = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const createdAt = new Date(transaction.createdAt);
  if (Number.isNaN(createdAt.getTime())) return dateLabel;
  return `${dateLabel} · ${createdAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
}

const BUDGET_ALERT_META: Record<Exclude<BudgetPerformance["status"], "ok">, { label: string; tone: "warning" | "expense" }> = {
  exceeded: { label: "Exceeded", tone: "expense" },
  near_limit: { label: "Near limit", tone: "warning" },
  watch: { label: "Watch", tone: "warning" },
};

const DAILY_BUDGET_META: Record<DailyBudgetGuide["status"], { label: string; cardTone: "positive" | "warning" | "expense"; metricTone: "neutral" | "warning" | "expense" }> = {
  healthy: { label: "On track", cardTone: "positive", metricTone: "neutral" },
  watch: { label: "Spending room is tight", cardTone: "warning", metricTone: "warning" },
  over: { label: "Monthly budget exceeded", cardTone: "expense", metricTone: "expense" },
};

function OverviewLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading Finance overview">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="col-span-2 h-44 rounded-2xl bg-secondary motion-safe:animate-pulse lg:row-span-2 lg:h-auto" />
        <div className="h-32 rounded-2xl bg-secondary motion-safe:animate-pulse" />
        <div className="h-32 rounded-2xl bg-secondary motion-safe:animate-pulse" />
        <div className="h-32 rounded-2xl bg-secondary motion-safe:animate-pulse" />
        <div className="h-32 rounded-2xl bg-secondary motion-safe:animate-pulse" />
      </div>
      <div className="h-40 rounded-2xl bg-secondary motion-safe:animate-pulse" />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-72 rounded-2xl bg-secondary motion-safe:animate-pulse" />
        <div className="h-72 rounded-2xl bg-secondary motion-safe:animate-pulse" />
      </div>
    </div>
  );
}

function DailyBudgetCard({ guide }: { guide: DailyBudgetGuide }) {
  const { cardTone: tone, label: statusLabel } = DAILY_BUDGET_META[guide.status];
  const toneClass = {
    positive: "border-success/25 bg-success/5 text-success",
    warning: "border-warning/25 bg-warning/5 text-warning",
    expense: "border-destructive/25 bg-destructive/5 text-destructive",
  }[tone];

  return (
    <div className={cn("rounded-2xl border p-4 sm:p-5", toneClass)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-background/60">
            <Clock3 className="size-4" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground">Daily spending guide</p>
            <p className="text-xs text-muted-foreground">{guide.daysRemaining} days including today</p>
          </div>
        </div>
        <span className="rounded-full border border-current/20 px-2.5 py-1 text-xs font-semibold">{statusLabel}</span>
      </div>

      <div className="mt-5 grid grid-cols-1 divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <div className="pb-4 sm:pb-0 sm:pr-4">
          <p className="text-xs text-muted-foreground">Available per day</p>
          <p className="mt-1 truncate font-mono text-xl font-semibold tracking-tight text-foreground tabular-nums" title={krw.format(guide.availablePerDayKrw)}>{krw.format(guide.availablePerDayKrw)}</p>
        </div>
        <div className="py-4 sm:px-4 sm:py-0">
          <p className="text-xs text-muted-foreground">Spent today</p>
          <p className="mt-1 truncate font-mono text-xl font-semibold tracking-tight text-destructive tabular-nums" title={krw.format(guide.spentTodayKrw)}>{krw.format(guide.spentTodayKrw)}</p>
        </div>
        <div className="pt-4 sm:pl-4 sm:pt-0">
          <p className="text-xs text-muted-foreground">Monthly remaining</p>
          <p className="mt-1 truncate font-mono text-xl font-semibold tracking-tight text-foreground tabular-nums" title={krw.format(guide.monthlyRemainingKrw)}>{krw.format(guide.monthlyRemainingKrw)}</p>
        </div>
      </div>
    </div>
  );
}

function BudgetAlerts({ budgets }: { budgets: BudgetPerformance[] }) {
  const alerts = budgets.filter((budget) => budget.status !== "ok");
  if (alerts.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border bg-card p-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-success/10 text-success"><Scale className="size-4" aria-hidden="true" /></span>
        <div>
          <p className="text-sm font-semibold">No budget alerts</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Budgeted categories are below the 80% watch threshold.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {alerts.map((budget) => {
        const status = BUDGET_ALERT_META[budget.status as Exclude<BudgetPerformance["status"], "ok">];
        return (
          <Link key={budget.categoryId} href="/finance/budgets" className="block rounded-2xl border bg-card p-4 transition-colors hover:bg-secondary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <div className="flex items-center gap-3">
              <CategoryIcon icon={budget.categoryIcon} color={budget.categoryColor} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate text-sm font-semibold">{budget.categoryName}</p>
                  <span className={cn("shrink-0 text-xs font-semibold", status.tone === "expense" ? "text-destructive" : "text-warning")}>{status.label} · {budget.usagePct}%</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{krw.format(budget.spentKrw)} of {krw.format(budget.budgetKrw)}</p>
                <div className="mt-2"><FinanceProgress value={budget.usagePct} label={`${budget.categoryName} budget ${budget.usagePct}% used`} tone={status.tone} /></div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function CategorySpending({ categories, budgets, totalExpense }: { categories: CategoryAmount[]; budgets: BudgetPerformance[]; totalExpense: number }) {
  const budgetByCategory = new Map(budgets.map((budget) => [budget.categoryId, budget]));
  if (categories.length === 0) {
    return <FinanceEmptyState icon={WalletCards} title="No category spending yet" description="Expense categories will appear here as transactions are added." />;
  }

  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      <div className="divide-y divide-border">
        {categories.slice(0, 6).map((category) => {
          const share = totalExpense > 0 ? (category.amountKrw / totalExpense) * 100 : 0;
          const budget = category.categoryId ? budgetByCategory.get(category.categoryId) : undefined;
          return (
            <div key={category.categoryId ?? category.categoryName} className="p-4">
              <div className="flex items-center gap-3">
                <CategoryIcon icon={category.categoryIcon} color={category.categoryColor} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{category.categoryName}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{share.toFixed(0)}% of expenses{budget ? ` · ${budget.usagePct}% of budget` : " · No category budget"}</p>
                    </div>
                    <p className="shrink-0 font-mono text-sm font-semibold tabular-nums">{krw.format(category.amountKrw)}</p>
                  </div>
                  <div className="mt-2.5"><FinanceProgress value={share} label={`${category.categoryName} is ${share.toFixed(0)}% of expenses`} color={category.categoryColor} /></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SpendingTrend({ data }: { data: DailySpendingPoint[] }) {
  const width = 620;
  const height = 180;
  const max = Math.max(1, ...data.map((point) => point.amountKrw));
  const points = data.map((point, index) => ({
    ...point,
    x: data.length <= 1 ? 0 : (index / (data.length - 1)) * width,
    y: height - (point.amountKrw / max) * (height - 12),
  }));
  const linePath = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(" ");
  const areaPath = points.length > 0 ? `${linePath} L ${width} ${height} L 0 ${height} Z` : "";
  const activeDays = data.filter((point) => point.amountKrw > 0).length;
  const peak = data.reduce((highest, point) => point.amountKrw > highest.amountKrw ? point : highest, data[0] ?? { date: "", amountKrw: 0 });

  return (
    <div className="rounded-2xl border bg-card p-4 sm:p-5">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div><p className="text-xs text-muted-foreground">Peak day</p><p className="mt-1 font-mono text-lg font-semibold tabular-nums">{krw.format(peak.amountKrw)}</p></div>
        <p id="spending-trend-summary" className="text-xs text-muted-foreground">Spending on {activeDays} of {data.length} days</p>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-48 w-full overflow-visible" role="img" aria-labelledby="spending-trend-title spending-trend-summary" preserveAspectRatio="none">
        <title id="spending-trend-title">Daily expense trend</title>
        <defs><linearGradient id="finance-overview-trend" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--finance-chart)" stopOpacity="0.28" /><stop offset="100%" stopColor="var(--finance-chart)" stopOpacity="0" /></linearGradient></defs>
        {[0, 0.5, 1].map((position) => <line key={position} x1="0" x2={width} y1={height * position} y2={height * position} stroke="var(--border)" strokeDasharray="4 6" vectorEffect="non-scaling-stroke" />)}
        {areaPath ? <path d={areaPath} fill="url(#finance-overview-trend)" /> : null}
        {linePath ? <path d={linePath} fill="none" stroke="var(--finance-chart)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" /> : null}
      </svg>
      <div className="mt-2 flex justify-between text-[11px] text-muted-foreground"><span>Day 1</span><span>Day {data.length}</span></div>
    </div>
  );
}

function RecentActivity({ transactions }: { transactions: Transaction[] }) {
  if (transactions.length === 0) {
    return <FinanceEmptyState icon={ReceiptText} title="No transactions yet" description="Add your first income or expense to start your Finance overview." action={<Link href="/finance/transactions" className={buttonVariants({ variant: "outline", size: "sm" })}>Open Transactions</Link>} />;
  }

  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      <div className="divide-y divide-border">
        {transactions.map((transaction) => (
          <Link key={transaction.id} href="/finance/transactions" className="flex min-h-16 items-center gap-3 px-4 py-3 transition-colors hover:bg-secondary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring">
            <CategoryIcon icon={transaction.categoryIcon} color={transaction.categoryColor} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{transaction.description || "Untitled transaction"}</p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">{transaction.categoryName || (transaction.type === "income" ? "Income" : "Uncategorized")} · {formatTransactionDate(transaction)}</p>
            </div>
            <p className={cn("shrink-0 font-mono text-sm font-semibold tracking-tight tabular-nums", transaction.type === "income" ? "text-success" : "text-foreground")}>{transactionAmount(transaction)}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function FinanceOverview() {
  const [monthOffset, setMonthOffset] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const requestKey = `${monthOffset}:${refreshKey}`;
  const [result, setResult] = useState<{
    key: string;
    summary: FinanceOverviewSummary | null;
    error: string | null;
  }>({ key: "", summary: null, error: null });
  const loading = result.key !== requestKey;
  const summary = loading ? null : result.summary;
  const error = loading ? null : result.error;

  useEffect(() => {
    let active = true;
    void getFinanceOverview(monthKey(monthOffset))
      .then((data) => {
        if (active) setResult({ key: requestKey, summary: data, error: null });
      })
      .catch(() => {
        if (active) {
          setResult({
            key: requestKey,
            summary: null,
            error: "We couldn't load your Finance overview. Try again in a moment.",
          });
        }
      });
    return () => { active = false; };
  }, [monthOffset, requestKey]);

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Financial position</p>
          <p className="mt-1 text-sm text-muted-foreground">Income, spending, budgets, and activity in one place.</p>
        </div>
        <MonthSelector
          label={monthLabel(monthOffset)}
          onPrevious={() => setMonthOffset((offset) => offset - 1)}
          onNext={() => setMonthOffset((offset) => offset + 1)}
          nextDisabled={monthOffset >= 0}
          ariaLabel="Finance month selector"
        />
      </div>

      {error ? (
        <FinanceErrorState
          title="Finance overview unavailable"
          description={error}
          onRetry={() => setRefreshKey((key) => key + 1)}
        />
      ) : loading || !summary ? <OverviewLoading /> : (
        <>
          <FinanceSection id="finance-summary" title="Summary" description={`Your ${monthLabel(monthOffset)} cash-flow snapshot.`}>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <div className="col-span-2 lg:row-span-2"><FinanceMetricCard label="Net cash flow" value={signedAmount(summary.totals.netCashFlowKrw)} detail="Income minus expenses" icon={Landmark} tone={summary.totals.netCashFlowKrw > 0 ? "positive" : summary.totals.netCashFlowKrw < 0 ? "expense" : "neutral"} featured /></div>
              <FinanceMetricCard label="Income" value={krw.format(summary.totals.totalIncomeKrw)} detail={`${summary.totals.transactionCount} total transactions`} icon={ArrowUpRight} tone="positive" />
              <FinanceMetricCard label="Expenses" value={krw.format(summary.totals.totalExpenseKrw)} detail="Recorded this month" icon={ArrowDownRight} tone="expense" />
              <FinanceMetricCard label="Savings rate" value={`${summary.totals.savingsRatePct}%`} detail={summary.totals.totalIncomeKrw > 0 ? "Share of income retained" : "Add income to calculate"} icon={PiggyBank} tone={summary.totals.savingsRatePct >= 0 ? "positive" : "expense"} />
              <FinanceMetricCard label="Budget state" value={summary.dailyBudget ? krw.format(summary.dailyBudget.monthlyRemainingKrw) : `${summary.budgetPerformance.length} active`} detail={summary.dailyBudget ? "Remaining this month" : "Category budgets"} icon={Scale} tone={summary.dailyBudget ? DAILY_BUDGET_META[summary.dailyBudget.status].metricTone : "neutral"} />
            </div>
          </FinanceSection>

          <FinanceSection id="finance-daily-budget" title="Daily budget" description="A deterministic guide based on your remaining category budgets.">
            {summary.dailyBudget ? <DailyBudgetCard guide={summary.dailyBudget} /> : (
              <div className="flex items-center gap-3 rounded-2xl border bg-card p-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-muted-foreground"><CalendarDays className="size-4" aria-hidden="true" /></span>
                <div className="min-w-0 flex-1"><p className="text-sm font-semibold">{monthOffset === 0 ? "Set category budgets to unlock your daily guide" : "Daily guide is available for the current month"}</p><p className="mt-0.5 text-xs text-muted-foreground">Historical spending remains available in the trend below.</p></div>
                {monthOffset === 0 ? <Link href="/finance/budgets" className="shrink-0 text-xs font-semibold text-foreground underline-offset-4 hover:underline">Budgets</Link> : null}
              </div>
            )}
          </FinanceSection>

          <FinanceSection id="finance-budget-alerts" title="Budget alerts" description="Categories at or above 80% of their monthly limit."><BudgetAlerts budgets={summary.budgetPerformance} /></FinanceSection>

          {summary.totals.transactionCount === 0 ? (
            <FinanceEmptyState icon={ReceiptText} title={`No transactions in ${monthLabel(monthOffset)}`} description="Add your first income or expense to populate spending, trends, and recent activity." action={<Link href="/finance/transactions" className={buttonVariants({ variant: "outline", size: "sm" })}>Open Transactions</Link>} />
          ) : (
            <>
              <FinanceSection id="finance-spending" title="Spending" description="Where your expenses went and how each category relates to its budget."><CategorySpending categories={summary.categories} budgets={summary.budgetPerformance} totalExpense={summary.totals.totalExpenseKrw} /></FinanceSection>
              <FinanceSection id="finance-trends" title="Trends" description="Daily expenses across the selected month."><SpendingTrend data={summary.dailySpending} /></FinanceSection>
              <FinanceSection id="finance-recent-activity" title="Recent activity" description="Latest income and expenses for this month." action={<Link href="/finance/transactions" className="inline-flex min-h-11 items-center gap-1 text-xs font-semibold text-foreground underline-offset-4 hover:underline">View all <ArrowRight className="size-3.5" aria-hidden="true" /></Link>}><RecentActivity transactions={summary.recentTransactions} /></FinanceSection>
              <FinanceSection id="finance-review" title="Review" description="Turn this month into a clear, deterministic financial review.">
                <Link href="/finance/review" className="group flex min-h-24 items-center gap-4 rounded-2xl border bg-card p-4 transition-colors hover:bg-secondary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:p-5">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-finance-chart/10 text-finance-chart"><TrendingUp className="size-5" aria-hidden="true" /></span>
                  <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">Review {monthLabel(monthOffset)}</span><span className="mt-1 block text-xs leading-relaxed text-muted-foreground">Compare totals, category changes, budgets, subscriptions, and savings goals.</span></span>
                  <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </Link>
              </FinanceSection>
            </>
          )}
        </>
      )}
    </div>
  );
}
