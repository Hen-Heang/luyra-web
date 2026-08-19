"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { krw, toAmount } from "@/lib/integrations/money-flow/format";
import type { Category } from "@/lib/integrations/money-flow/types";

export function BudgetItem({
  category,
  budgetAmount,
  spent,
  onSave,
  onRemove,
}: {
  category: Category;
  budgetAmount: number | string | null;
  spent: number | string;
  onSave: (amount: number) => Promise<void>;
  onRemove: () => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [amount, setAmount] = useState(budgetAmount != null ? String(budgetAmount) : "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const budgetValue = toAmount(budgetAmount);
  const spentValue = toAmount(spent);
  const hasBudget = budgetAmount != null && budgetValue > 0;
  const percent = hasBudget ? Math.min(100, Math.round((spentValue / budgetValue) * 100)) : 0;
  const overBudget = hasBudget && spentValue > budgetValue;

  async function handleSave() {
    const parsed = Number(amount);
    if (!Number.isFinite(parsed) || parsed < 0) {
      setError("Enter a valid amount.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      await onSave(parsed);
      setEditing(false);
    } catch {
      setError("Couldn't save the budget.");
    } finally {
      setPending(false);
    }
  }

  async function handleRemove() {
    setPending(true);
    try {
      await onRemove();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 p-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm font-medium">{category.name}</span>
        {editing ? (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min="0"
              step="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-8 w-32"
              autoFocus
            />
            <Button size="sm" onClick={handleSave} disabled={pending}>
              Save
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {krw.format(spentValue)} {hasBudget ? `/ ${krw.format(budgetValue)}` : "· no budget set"}
            </span>
            <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
              {hasBudget ? "Edit" : "Set budget"}
            </Button>
            {hasBudget && (
              <Button size="sm" variant="ghost" onClick={handleRemove} disabled={pending}>
                Remove
              </Button>
            )}
          </div>
        )}
      </div>

      {hasBudget && (
        <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className={cn("h-full rounded-full", overBudget ? "bg-destructive" : "bg-primary")}
            style={{ width: `${percent}%` }}
          />
        </div>
      )}

      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
}
