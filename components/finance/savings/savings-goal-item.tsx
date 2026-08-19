"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usd } from "@/lib/finance-format";
import type { CreateSavingsGoalInput, UpdateSavingsGoalInput } from "@/lib/validation/finance";
import type { SavingsGoal } from "@/types/finance";
import { SavingsGoalForm } from "./savings-goal-form";

export function SavingsGoalItem({
  goal,
  onUpdate,
  onDelete,
  onContribute,
}: {
  goal: SavingsGoal;
  onUpdate: (input: CreateSavingsGoalInput & UpdateSavingsGoalInput) => Promise<void>;
  onDelete: () => Promise<void>;
  onContribute: (amountUsd: number) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [contributing, setContributing] = useState(false);
  const [contributionAmount, setContributionAmount] = useState("");
  const [pending, setPending] = useState(false);

  const percent = goal.targetUsd > 0 ? Math.min(100, Math.round((goal.currentUsd / goal.targetUsd) * 100)) : 0;

  async function handleDelete() {
    setPending(true);
    try {
      await onDelete();
    } finally {
      setPending(false);
    }
  }

  async function handleContribute() {
    const amount = Number(contributionAmount);
    if (!Number.isFinite(amount) || amount <= 0) return;
    setPending(true);
    try {
      await onContribute(amount);
      setContributionAmount("");
      setContributing(false);
    } finally {
      setPending(false);
    }
  }

  if (editing) {
    return (
      <div className="rounded-lg border border-border p-4">
        <SavingsGoalForm
          mode="edit"
          goal={goal}
          onSave={async (input) => {
            await onUpdate(input);
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="flex size-10 shrink-0 items-center justify-center rounded-xl text-lg"
            style={{ backgroundColor: `${goal.color}1a` }}
          >
            {goal.icon}
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold">{goal.name}</h3>
            {goal.deadline && (
              <p className="text-xs text-muted-foreground">
                Target:{" "}
                {new Date(`${goal.deadline}T00:00:00`).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => setEditing(true)} aria-label="Edit goal">
            <Pencil className="size-4" />
          </Button>
          {confirmingDelete ? (
            <div className="flex items-center gap-1">
              <Button variant="destructive" size="sm" onClick={handleDelete} disabled={pending}>
                Confirm
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setConfirmingDelete(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button variant="ghost" size="icon" onClick={() => setConfirmingDelete(true)} aria-label="Delete goal">
              <Trash2 className="size-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="mt-3">
        <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
          <div className="h-full rounded-full" style={{ width: `${percent}%`, backgroundColor: goal.color }} />
        </div>
        <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {usd.format(goal.currentUsd)} of {usd.format(goal.targetUsd)}
          </span>
          <span>{percent}%</span>
        </div>
      </div>

      {goal.note && <p className="mt-2 text-xs text-muted-foreground">{goal.note}</p>}

      <div className="mt-3">
        {contributing ? (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="Amount (USD)"
              value={contributionAmount}
              onChange={(e) => setContributionAmount(e.target.value)}
              className="h-8 w-36"
              autoFocus
            />
            <Button size="sm" onClick={handleContribute} disabled={pending}>
              Add
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setContributing(false)}>
              Cancel
            </Button>
          </div>
        ) : (
          <Button size="sm" variant="outline" onClick={() => setContributing(true)}>
            <Plus />
            Add contribution
          </Button>
        )}
      </div>
    </div>
  );
}
