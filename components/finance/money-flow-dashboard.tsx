"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowDownRight, ArrowUpRight, WalletCards } from "lucide-react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MoneyFlowGate } from "@/components/finance/money-flow-session";
import { monthBounds } from "@/lib/integrations/money-flow/month";
import { krw, toAmount } from "@/lib/integrations/money-flow/format";

type Transaction = {
  id: string;
  date: string;
  type: "income" | "expense" | string;
  amount_krw: number | string;
  description: string | null;
};

function MoneyFlowSummary({ client }: { client: SupabaseClient }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTransactions = useCallback(async () => {
    const { start, end } = monthBounds();
    const { data, error: queryError } = await client
      .from("transactions")
      .select("id, date, type, amount_krw, description")
      .gte("date", start)
      .lt("date", end)
      .order("date", { ascending: false })
      .limit(1000);

    if (queryError) {
      setError(`Money Flow data is unavailable: ${queryError.message}`);
      setTransactions([]);
      setLoading(false);
      return;
    }

    setError(null);
    setTransactions((data ?? []) as Transaction[]);
    setLoading(false);
  }, [client]);

  useEffect(() => {
    void (async () => {
      await loadTransactions();
    })();
  }, [loadTransactions]);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading this month’s activity…</p>;
  }

  const income = transactions
    .filter((transaction) => transaction.type === "income")
    .reduce((total, transaction) => total + toAmount(transaction.amount_krw), 0);
  const expenses = transactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((total, transaction) => total + toAmount(transaction.amount_krw), 0);

  return (
    <>
      {error && (
        <p
          className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
          role="alert"
        >
          {error}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>This month’s income</CardDescription>
            <CardTitle className="text-xl">{krw.format(income)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>This month’s expenses</CardDescription>
            <CardTitle className="text-xl">{krw.format(expenses)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Cash flow</CardDescription>
            <CardTitle className="text-xl">{krw.format(income - expenses)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <WalletCards className="size-4" />
            <CardTitle>Recent Money Flow activity</CardTitle>
          </div>
          <CardDescription>Read directly from the existing Money Flow Supabase project.</CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="py-4 text-sm text-muted-foreground">No transactions recorded this month.</p>
          ) : (
            <div className="divide-y divide-border">
              {transactions.slice(0, 6).map((transaction) => {
                const isIncome = transaction.type === "income";
                const Icon = isIncome ? ArrowUpRight : ArrowDownRight;
                return (
                  <div key={transaction.id} className="flex items-center justify-between gap-4 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <Icon className={isIncome ? "size-4 text-emerald-600" : "size-4 text-rose-600"} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {transaction.description || "Untitled transaction"}
                        </p>
                        <p className="text-xs text-muted-foreground">{transaction.date}</p>
                      </div>
                    </div>
                    <span className="shrink-0 text-sm font-medium">
                      {isIncome ? "+" : "−"}
                      {krw.format(toAmount(transaction.amount_krw))}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

export function MoneyFlowDashboard() {
  return <MoneyFlowGate>{({ client }) => <MoneyFlowSummary client={client} />}</MoneyFlowGate>;
}
