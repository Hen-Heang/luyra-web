"use client";

import { useEffect, useState } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAnalyticsSummary } from "@/lib/api/finance";
import { krw } from "@/lib/finance-format";
import { monthKey } from "@/lib/finance-month";
import type { AnalyticsSummary } from "@/types/finance";

export function FinanceOverview() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await getAnalyticsSummary(monthKey());
        if (active) setSummary(data);
      } catch {
        if (active) setError("Couldn't load this month's summary.");
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  if (error) return <p className="text-sm text-destructive">{error}</p>;
  if (!summary) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <Card>
        <CardHeader>
          <CardDescription className="flex items-center gap-1.5">
            <ArrowUpRight className="size-3.5 text-emerald-600" />
            This month&apos;s income
          </CardDescription>
          <CardTitle className="text-xl">{krw.format(summary.totals.totalIncomeKrw)}</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <CardDescription className="flex items-center gap-1.5">
            <ArrowDownRight className="size-3.5 text-rose-600" />
            This month&apos;s expenses
          </CardDescription>
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
  );
}
