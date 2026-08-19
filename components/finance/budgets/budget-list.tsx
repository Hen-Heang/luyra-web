"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { monthBounds, monthLabel } from "@/lib/finance-month";
import { deleteBudget, listBudgets, upsertBudget } from "@/lib/api/finance";
import { BudgetItem } from "@/components/finance/budgets/budget-item";
import type { Budget, Category } from "@/types/finance";

export function BudgetList() {
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
      const result = await listBudgets(start, end);
      setCategories(result.categories);
      setBudgets(result.budgets);
      setSpendByCategory(result.spendByCategory);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load budgets.");
    } finally {
      setLoading(false);
    }
  }, [monthOffset]);

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, [load]);

  async function handleSave(categoryId: string, amount: number) {
    await upsertBudget({ categoryId, amountKrw: amount });
    await load();
  }

  async function handleRemove(categoryId: string) {
    await deleteBudget(categoryId);
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
            const budget = budgets.find((b) => b.categoryId === category.id);
            return (
              <BudgetItem
                key={category.id}
                category={category}
                budgetAmount={budget ? budget.amountKrw : null}
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
