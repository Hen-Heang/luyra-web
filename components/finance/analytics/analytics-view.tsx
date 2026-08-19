"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAnalyticsSummary } from "@/lib/api/finance";
import { krw } from "@/lib/finance-format";
import { monthKey, monthLabel } from "@/lib/finance-month";
import type { AnalyticsSummary } from "@/types/finance";

export function AnalyticsView() {
  const [monthOffset, setMonthOffset] = useState(0);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setSummary(await getAnalyticsSummary(monthKey(monthOffset)));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load analytics.");
    } finally {
      setLoading(false);
    }
  }, [monthOffset]);

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, [load]);

  const maxCategoryAmount = summary ? Math.max(1, ...summary.categories.map((c) => c.amountKrw)) : 1;

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
        <p className="text-sm text-muted-foreground">Loading analytics…</p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <Card>
              <CardHeader>
                <CardDescription>Income</CardDescription>
                <CardTitle className="text-xl">{krw.format(summary.totals.totalIncomeKrw)}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>Expenses</CardDescription>
                <CardTitle className="text-xl">{krw.format(summary.totals.totalExpenseKrw)}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>Cash flow</CardDescription>
                <CardTitle className="text-xl">{krw.format(summary.totals.netCashFlowKrw)}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Spending by category</CardTitle>
              <CardDescription>
                {summary.categories.length === 0 ? "No expenses recorded this month." : "Highest first."}
              </CardDescription>
            </CardHeader>
            {summary.categories.length > 0 && (
              <CardContent className="flex flex-col gap-3">
                {summary.categories.map((category) => (
                  <div key={category.categoryId ?? category.categoryName} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{category.categoryName}</span>
                      <span className="text-muted-foreground">{krw.format(category.amountKrw)}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${(category.amountKrw / maxCategoryAmount) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
