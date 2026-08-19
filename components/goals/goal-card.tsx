"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { deleteGoal, updateGoal } from "@/lib/api/goals";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GoalForm } from "@/components/goals/goal-form";
import type { Goal, GoalStatus } from "@/types/goal";

const STATUS_VARIANT: Record<GoalStatus, "default" | "outline" | "success"> = {
  active: "default",
  paused: "outline",
  completed: "success",
};

const CATEGORY_LABEL: Record<string, string> = {
  personal: "Personal",
  career: "Career",
  finance: "Finance",
  learning: "Learning",
  health: "Health",
  other: "Other",
};

export function GoalCard({ goal }: { goal: Goal }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [progressInput, setProgressInput] = useState(String(goal.progress));
  const [pending, setPending] = useState(false);

  async function setStatus(status: GoalStatus) {
    setPending(true);
    try {
      await updateGoal(goal.id, { status });
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function saveProgress() {
    const value = Math.min(100, Math.max(0, Math.round(Number(progressInput)) || 0));
    setPending(true);
    try {
      await updateGoal(goal.id, { progress: value });
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function handleDelete() {
    setPending(true);
    try {
      await deleteGoal(goal.id);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  if (editing) {
    return (
      <div className="rounded-lg border border-border p-4">
        <GoalForm mode="edit" goal={goal} onDone={() => setEditing(false)} />
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-semibold">{goal.title}</h3>
            <Badge variant={STATUS_VARIANT[goal.status]}>{goal.status}</Badge>
          </div>
          {goal.category && (
            <p className="mt-0.5 text-xs text-muted-foreground">{CATEGORY_LABEL[goal.category]}</p>
          )}
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
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setConfirmingDelete(true)}
              aria-label="Delete goal"
            >
              <Trash2 className="size-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="mt-3">
        <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
          <div className="h-full rounded-full bg-primary" style={{ width: `${goal.progress}%` }} />
        </div>
        <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
          <span>{goal.progress}%</span>
          {goal.targetDate && (
            <span>
              Target:{" "}
              {new Date(goal.targetDate).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          <input
            type="number"
            min={0}
            max={100}
            value={progressInput}
            onChange={(e) => setProgressInput(e.target.value)}
            className="h-8 w-16 rounded-md border border-input bg-transparent px-2 text-sm"
          />
          <Button size="sm" variant="outline" onClick={saveProgress} disabled={pending}>
            Update progress
          </Button>
        </div>

        {goal.status === "active" && (
          <>
            <Button size="sm" variant="outline" onClick={() => setStatus("paused")} disabled={pending}>
              Pause
            </Button>
            <Button size="sm" variant="outline" onClick={() => setStatus("completed")} disabled={pending}>
              Complete
            </Button>
          </>
        )}
        {goal.status === "paused" && (
          <>
            <Button size="sm" variant="outline" onClick={() => setStatus("active")} disabled={pending}>
              Resume
            </Button>
            <Button size="sm" variant="outline" onClick={() => setStatus("completed")} disabled={pending}>
              Complete
            </Button>
          </>
        )}
        {goal.status === "completed" && (
          <Button size="sm" variant="outline" onClick={() => setStatus("active")} disabled={pending}>
            Reopen
          </Button>
        )}
      </div>
    </div>
  );
}
