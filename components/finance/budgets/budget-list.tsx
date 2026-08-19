"use client";

import { useCallback, useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { MoneyFlowGate } from "@/components/finance/money-flow-session";
import { monthBounds, monthLabel } from "@/lib/integrations/money-flow/month";
import { listCategories } from "@/lib/integrations/money-flow/categories";
import { deleteBudget, listBudgets, upsertBudget } from "@/lib/integrations/money-flow/budgets";
import { toAmount } from "@/lib/integrations/money-flow/format";
import { BudgetItem } from "@/components/finance/budgets/budget-item";
import type { Budget, Category } from "@/lib/integrations/money-flow/types";

function BudgetsContent({ client, userId }: { client: SupabaseClient; userId: string }) {
  const [monthOffset, setMonthOffset] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [spendByCategory, setSpendByCategory] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { start, end } = monthBounds(monthOffset);
      const [cats, budgetRows, spendResult] = await Promise.all([
        listCategories(client),
        listBudgets(client),
        client
          .from("transactions")
          .select("category_id, amount_krw")
          .eq("type", "expense")
          .gte("date", start)
          .lt("date", end),
      ]);

      if (spendResult.error) throw new Error(spendResult.error.message);

      const totals: Record<string, number> = {};
      for (const row of spendResult.data ?? []) {
        if (!row.category_id) continue;
        totals[row.category_id] = (totals[row.category_id] ?? 0) + toAmount(row.amount_krw);
      }

      setCategories(cats.filter((c) => c.type === "expense" || c.type === "both"));
      setBudgets(budgetRows);
      setSpendByCategory(totals);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load budgets.");
    } finally {
      setLoading(false);
    }
  }, [client, monthOffset]);

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, [load]);

  async function handleSave(categoryId: string, amount: number) {
    await upsertBudget(client, userId, { category_id: categoryId, amount_krw: amount });
    await load();
  }

  async function handleRemove(categoryId: string) {
    await deleteBudget(client, categoryId);
    await load();
  }

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
        <p
          className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
          role="alert"
        >
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading budgets…</p>
      ) : categories.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">No expense categories found.</p>
      ) : (
        <div className="divide-y divide-border rounded-lg border border-border">
          {categories.map((category) => {
            const budget = budgets.find((b) => b.category_id === category.id);
            return (
              <BudgetItem
                key={category.id}
                category={category}
                budgetAmount={budget ? budget.amount_krw : null}
                spent={spendByCategory[category.id] ?? 0}
                onSave={(amount) => handleSave(category.id, amount)}
                onRemove={() => handleRemove(category.id)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export function BudgetList() {
  return <MoneyFlowGate>{({ client, userId }) => <BudgetsContent client={client} userId={userId} />}</MoneyFlowGate>;
}
