"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FinanceEmptyState, FinanceErrorState, FinanceSection, MonthSelector } from "@/components/finance/ui/finance-primitives";
import { BudgetCard } from "@/components/finance/budgets/budget-card";
import { BudgetSummary } from "@/components/finance/budgets/budget-summary";
import { BudgetSheet } from "@/components/finance/budgets/budget-sheet";
import { DeleteBudgetDialog } from "@/components/finance/budgets/delete-budget-dialog";
import { monthBounds, monthLabel } from "@/lib/finance-month";
import { deleteBudget, listBudgets, upsertBudget } from "@/lib/api/finance";
import type { BudgetPerformance, Category } from "@/types/finance";

function BudgetListSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading budgets">
      <div className="grid grid-cols-1 gap-3 min-[380px]:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((card) => (
          <div key={card} className="h-28 rounded-2xl bg-secondary motion-safe:animate-pulse" />
        ))}
      </div>
      <div className="space-y-3">
        {[0, 1, 2].map((card) => (
          <div key={card} className="h-28 rounded-2xl bg-secondary motion-safe:animate-pulse" />
        ))}
      </div>
    </div>
  );
}

export function BudgetList() {
  const [monthOffset, setMonthOffset] = useState(0);
  const [reloadToken, setReloadToken] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [performance, setPerformance] = useState<BudgetPerformance[]>([]);
  const [budgetedCategoryIds, setBudgetedCategoryIds] = useState<Set<string>>(new Set());
  const [sheetTarget, setSheetTarget] = useState<
    { mode: "create"; unbudgetedCategories: Category[] } | { mode: "edit"; budget: BudgetPerformance } | null
  >(null);
  const [removeTarget, setRemoveTarget] = useState<BudgetPerformance | null>(null);
  const [removing, setRemoving] = useState(false);

  const requestKey = `${monthOffset}:${reloadToken}`;
  const [result, setResult] = useState<{ key: string; error: string | null }>({ key: "", error: null });
  const loading = result.key !== requestKey;

  useEffect(() => {
    let active = true;
    const { start, end } = monthBounds(monthOffset);
    listBudgets(start, end)
      .then((data) => {
        if (!active) return;
        setCategories(data.categories);
        setPerformance(data.performance);
        setBudgetedCategoryIds(new Set(data.budgets.map((budget) => budget.categoryId)));
        setResult({ key: requestKey, error: null });
      })
      .catch(() => {
        if (active) setResult({ key: requestKey, error: "We couldn't load your budgets. Try again in a moment." });
      });
    return () => {
      active = false;
    };
  }, [requestKey, monthOffset]);

  const unbudgetedCategories = useMemo(
    () => categories.filter((category) => !budgetedCategoryIds.has(category.id)),
    [categories, budgetedCategoryIds]
  );

  function refresh() {
    setReloadToken((token) => token + 1);
  }

  async function handleSave(categoryId: string, amountKrw: number) {
    await upsertBudget({ categoryId, amountKrw });
    refresh();
  }

  async function handleRemove() {
    if (!removeTarget) return;
    setRemoving(true);
    try {
      await deleteBudget(removeTarget.categoryId);
      setRemoveTarget(null);
      refresh();
    } finally {
      setRemoving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <MonthSelector
          label={monthLabel(monthOffset)}
          onPrevious={() => setMonthOffset((offset) => offset - 1)}
          onNext={() => setMonthOffset((offset) => offset + 1)}
          nextDisabled={monthOffset >= 0}
          ariaLabel="Budgets month selector"
          size="sm"
        />
        <Button
          size="sm"
          className="min-h-11"
          onClick={() => setSheetTarget({ mode: "create", unbudgetedCategories })}
          disabled={loading}
        >
          <Plus />
          Add budget
        </Button>
      </div>

      {result.error ? (
        <FinanceErrorState title="Budgets unavailable" description={result.error} onRetry={refresh} />
      ) : loading ? (
        <BudgetListSkeleton />
      ) : categories.length === 0 ? (
        <FinanceEmptyState
          icon={WalletCards}
          title="No expense categories yet"
          description="Add an expense category in Transactions before setting a budget."
        />
      ) : (
        <>
          <FinanceSection
            id="budgets-summary"
            title="Summary"
            description={`Standing category limits measured against ${monthLabel(monthOffset)} spending.`}
          >
            <BudgetSummary performance={performance} />
          </FinanceSection>

          <FinanceSection id="budgets-categories" title="Categories" description="Progress, remaining balance, and status for each budgeted category.">
            {performance.length === 0 ? (
              <FinanceEmptyState
                icon={WalletCards}
                title="No budgets set"
                description="Add a monthly limit for a category to start tracking budget health here."
                action={
                  <Button variant="outline" size="sm" onClick={() => setSheetTarget({ mode: "create", unbudgetedCategories })}>
                    <Plus />
                    Add budget
                  </Button>
                }
              />
            ) : (
              <div className="space-y-3">
                {performance.map((budget) => (
                  <BudgetCard
                    key={budget.categoryId}
                    budget={budget}
                    onEdit={(target) => setSheetTarget({ mode: "edit", budget: target })}
                    onRemoveRequest={setRemoveTarget}
                  />
                ))}
              </div>
            )}
          </FinanceSection>
        </>
      )}

      <BudgetSheet
        target={sheetTarget}
        open={sheetTarget !== null}
        onOpenChange={(open) => !open && setSheetTarget(null)}
        onSave={handleSave}
      />

      <DeleteBudgetDialog
        isOpen={removeTarget !== null}
        isDeleting={removing}
        categoryName={removeTarget?.categoryName ?? ""}
        onCancel={() => setRemoveTarget(null)}
        onConfirm={handleRemove}
      />
    </div>
  );
}
