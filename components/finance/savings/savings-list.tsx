"use client";

import { useCallback, useEffect, useState } from "react";
import { PiggyBank, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  addSavingsContribution,
  createSavingsGoal,
  deleteSavingsGoal,
  listSavingsGoals,
  updateSavingsGoal,
} from "@/lib/api/finance";
import type { CreateSavingsGoalInput } from "@/lib/validation/finance";
import type { SavingsGoal } from "@/types/finance";
import { SavingsGoalForm } from "./savings-goal-form";
import { SavingsGoalItem } from "./savings-goal-item";

export function SavingsList() {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setGoals(await listSavingsGoals());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load savings goals.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, [load]);

  async function handleCreate(input: CreateSavingsGoalInput) {
    await createSavingsGoal(input);
    setCreating(false);
    await load();
  }

  return (
    <div className="flex flex-col gap-3">
      {creating ? (
        <div className="rounded-lg border border-border p-4">
          <SavingsGoalForm mode="create" onSave={handleCreate} onCancel={() => setCreating(false)} />
        </div>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setCreating(true)} className="self-start">
          <Plus />
          New savings goal
        </Button>
      )}

      {error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading savings goals…</p>
      ) : goals.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-card/30 px-4 py-10 text-center">
          <div className="flex size-12 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <PiggyBank size={24} strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">No savings goals yet</p>
            <p className="mt-1 text-xs text-muted-foreground">Create one to start tracking your progress.</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {goals.map((goal) => (
            <SavingsGoalItem
              key={goal.id}
              goal={goal}
              onUpdate={async (input) => {
                await updateSavingsGoal(goal.id, input);
                await load();
              }}
              onDelete={async () => {
                await deleteSavingsGoal(goal.id);
                await load();
              }}
              onContribute={async (amount) => {
                await addSavingsContribution(goal.id, { amountUsd: amount });
                await load();
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
