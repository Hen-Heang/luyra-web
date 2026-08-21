"use client";

import { useCallback, useEffect, useState } from "react";
import { PiggyBank, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FinanceEmptyState, FinanceErrorState, FinanceSection } from "@/components/finance/ui/finance-primitives";
import { SavingsSummary } from "@/components/finance/savings/savings-summary";
import { SavingsGoalCard } from "@/components/finance/savings/savings-goal-card";
import { SavingsGoalSheet } from "@/components/finance/savings/savings-goal-sheet";
import { ContributionSheet } from "@/components/finance/savings/contribution-sheet";
import { DeleteSavingsGoalDialog } from "@/components/finance/savings/delete-savings-goal-dialog";
import {
  addSavingsContribution,
  createSavingsGoal,
  deleteSavingsGoal,
  listSavingsGoals,
  updateSavingsGoal,
} from "@/lib/api/finance";
import type { CreateSavingsGoalInput, UpdateSavingsGoalInput } from "@/lib/validation/finance";
import type { SavingsGoal } from "@/types/finance";

function SavingsListSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading savings goals">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((card) => (
          <div key={card} className="h-28 rounded-2xl bg-secondary motion-safe:animate-pulse" />
        ))}
      </div>
      <div className="space-y-3">
        {[0, 1].map((card) => (
          <div key={card} className="h-48 rounded-2xl bg-secondary motion-safe:animate-pulse" />
        ))}
      </div>
    </div>
  );
}

export function SavingsList() {
  const [reloadToken, setReloadToken] = useState(0);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [result, setResult] = useState<{ key: number; error: string | null }>({ key: -1, error: null });
  const loading = result.key !== reloadToken;

  const [goalSheet, setGoalSheet] = useState<{ mode: "create" | "edit"; goal?: SavingsGoal } | null>(null);
  const [contributionTarget, setContributionTarget] = useState<SavingsGoal | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SavingsGoal | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const load = useCallback(() => {
    listSavingsGoals()
      .then((data) => setGoals(data))
      .then(() => setResult({ key: reloadToken, error: null }))
      .catch(() => setResult({ key: reloadToken, error: "We couldn't load your savings goals. Try again in a moment." }));
  }, [reloadToken]);

  useEffect(() => {
    load();
  }, [load]);

  function refresh() {
    setReloadToken((token) => token + 1);
  }

  async function handleSaveGoal(input: CreateSavingsGoalInput & UpdateSavingsGoalInput) {
    if (goalSheet?.mode === "edit" && goalSheet.goal) {
      await updateSavingsGoal(goalSheet.goal.id, input);
    } else {
      await createSavingsGoal(input);
    }
    refresh();
  }

  async function handleContribute(amountUsd: number) {
    if (!contributionTarget) return;
    await addSavingsContribution(contributionTarget.id, { amountUsd });
    refresh();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteSavingsGoal(deleteTarget.id);
      setDeleteTarget(null);
      refresh();
    } catch {
      setDeleteError("Couldn't delete this goal. Try again in a moment.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Goal tracking</p>
        </div>
        <Button size="sm" className="min-h-11" onClick={() => setGoalSheet({ mode: "create" })}>
          <Plus />
          New goal
        </Button>
      </div>

      {result.error ? (
        <FinanceErrorState title="Savings unavailable" description={result.error} onRetry={refresh} />
      ) : loading ? (
        <SavingsListSkeleton />
      ) : goals.length === 0 ? (
        <FinanceEmptyState
          icon={PiggyBank}
          title="No savings goals yet"
          description="Create one to start tracking progress toward something you're saving for."
          action={
            <Button variant="outline" size="sm" onClick={() => setGoalSheet({ mode: "create" })}>
              <Plus />
              New goal
            </Button>
          }
        />
      ) : (
        <>
          <FinanceSection id="savings-summary" title="Summary" description="Combined progress across every goal.">
            <SavingsSummary goals={goals} />
          </FinanceSection>

          <FinanceSection id="savings-goals" title="Goals" description="Progress, remaining balance, and target date for each goal.">
            <div className="space-y-3">
              {goals.map((goal) => (
                <SavingsGoalCard
                  key={goal.id}
                  goal={goal}
                  onContribute={setContributionTarget}
                  onEdit={(target) => setGoalSheet({ mode: "edit", goal: target })}
                  onDeleteRequest={setDeleteTarget}
                />
              ))}
            </div>
          </FinanceSection>
        </>
      )}

      <SavingsGoalSheet
        mode={goalSheet?.mode ?? "create"}
        goal={goalSheet?.goal}
        open={goalSheet !== null}
        onOpenChange={(open) => !open && setGoalSheet(null)}
        onSave={handleSaveGoal}
      />

      <ContributionSheet
        goal={contributionTarget}
        open={contributionTarget !== null}
        onOpenChange={(open) => !open && setContributionTarget(null)}
        onSave={handleContribute}
      />

      <DeleteSavingsGoalDialog
        isOpen={deleteTarget !== null}
        isDeleting={deleting}
        goalName={deleteTarget?.name ?? ""}
        error={deleteError}
        onCancel={() => {
          setDeleteTarget(null);
          setDeleteError(null);
        }}
        onConfirm={handleDelete}
      />
    </div>
  );
}
