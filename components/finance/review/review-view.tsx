"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getReviewSummary } from "@/lib/api/finance";
import { krw } from "@/lib/finance-format";
import { monthKey, monthLabel } from "@/lib/finance-month";
import { cn } from "@/lib/utils";
import type { ReviewSummary } from "@/types/finance";

// Defaults to last month — a review of the month still in progress isn't
// meaningful yet, same reasoning Money Flow's review page uses.
export function ReviewView() {
  const [monthOffset, setMonthOffset] = useState(-1);
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setSummary(await getReviewSummary(monthKey(monthOffset)));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load the monthly review.");
    } finally {
      setLoading(false);
    }
  }, [monthOffset]);

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, [load]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => setMonthOffset((o) => o - 1)} aria-label="Previous month">
          ←
        </Button>
        <span className="text-sm font-medium">{monthLabel(monthOffset)}</span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setMonthOffset((o) => o + 1)}
          disabled={monthOffset >= 0}
          aria-label="Next month"
        >
          →
        </Button>
      </div>

      {error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      {loading || !summary ? (
        <p className="text-sm text-muted-foreground">Loading review…</p>
      ) : summary.totals.transactionCount === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">Nothing recorded for {monthLabel(monthOffset)}.</p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-4">
            <Card>
              <CardHeader>
                <CardDescription>Income</CardDescription>
                <CardTitle className="text-lg">{krw.format(summary.totals.totalIncomeKrw)}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>Spending</CardDescription>
                <CardTitle className="text-lg">{krw.format(summary.totals.totalExpenseKrw)}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>Net</CardDescription>
                <CardTitle className={cn("text-lg", summary.totals.netCashFlowKrw >= 0 ? "text-emerald-600" : "text-destructive")}>
                  {krw.format(summary.totals.netCashFlowKrw)}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>Savings rate</CardDescription>
                <CardTitle className={cn("text-lg", summary.totals.savingsRatePct >= 0 ? "text-emerald-600" : "text-destructive")}>
                  {summary.totals.savingsRatePct}%
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          {summary.budgetPerformance.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Budget performance</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {summary.budgetPerformance.map((entry) => (
                  <div key={entry.categoryId} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{entry.categoryName}</span>
                      <span className={cn("font-medium", entry.overBudget ? "text-destructive" : "text-muted-foreground")}>
                        {entry.usagePct}%
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                      <div
                        className={cn("h-full rounded-full", entry.overBudget ? "bg-destructive" : "bg-primary")}
                        style={{ width: `${Math.min(100, entry.usagePct)}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {krw.format(entry.spentKrw)} of {krw.format(entry.budgetKrw)}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Category comparison</CardTitle>
              <CardDescription>vs. {monthLabel(monthOffset - 1)}</CardDescription>
            </CardHeader>
            <CardContent className="divide-y divide-border">
              {summary.categoryComparison.slice(0, 8).map((entry) => (
                <div key={entry.categoryId ?? entry.categoryName} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span className="min-w-0 flex-1 truncate">{entry.categoryName}</span>
                  <span className="shrink-0 font-medium">{krw.format(entry.currentKrw)}</span>
                  <span
                    className={cn(
                      "w-24 shrink-0 text-right text-xs",
                      entry.deltaKrw > 0 ? "text-amber-600" : entry.deltaKrw < 0 ? "text-emerald-600" : "text-muted-foreground"
                    )}
                  >
                    {entry.deltaKrw > 0 ? "+" : ""}
                    {krw.format(entry.deltaKrw)}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="grid gap-3 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardDescription>Subscriptions</CardDescription>
                <CardTitle className="text-lg">{krw.format(summary.subscriptionsMonthlyKrw)}/mo</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>Savings goals</CardDescription>
                <CardTitle className="text-lg">{summary.savingsGoalsCount}</CardTitle>
              </CardHeader>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
