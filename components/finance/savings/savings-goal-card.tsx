"use client";

import { CalendarClock, CheckCircle2, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CategoryIcon, FinanceProgress } from "@/components/finance/ui/finance-primitives";
import { usd } from "@/lib/finance-format";
import { cn } from "@/lib/utils";
import type { SavingsGoal } from "@/types/finance";

function daysUntil(deadline: string | null): number | null {
  if (!deadline) return null;
  return Math.ceil((new Date(`${deadline}T00:00:00`).getTime() - Date.now()) / 86_400_000);
}

function deadlineLabel(deadline: string): string {
  return new Date(`${deadline}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function SavingsGoalCard({
  goal,
  onContribute,
  onEdit,
  onDeleteRequest,
}: {
  goal: SavingsGoal;
  onContribute: (goal: SavingsGoal) => void;
  onEdit: (goal: SavingsGoal) => void;
  onDeleteRequest: (goal: SavingsGoal) => void;
}) {
  const pct = goal.targetUsd > 0 ? Math.round((goal.currentUsd / goal.targetUsd) * 100) : 0;
  const remainingUsd = Math.max(goal.targetUsd - goal.currentUsd, 0);
  const reached = goal.targetUsd > 0 && goal.currentUsd >= goal.targetUsd;
  const days = daysUntil(goal.deadline);

  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="flex items-start gap-3">
        <CategoryIcon icon={goal.icon} color={goal.color} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-sm font-semibold">{goal.name}</p>
            {reached && <CheckCircle2 className="size-4 shrink-0 text-success" aria-label="Target reached" />}
          </div>
          {goal.deadline && (
            <p className={cn("mt-0.5 flex items-center gap-1 text-xs", days !== null && days < 0 && !reached ? "text-destructive" : "text-muted-foreground")}>
              <CalendarClock className="size-3.5" aria-hidden="true" />
              {deadlineLabel(goal.deadline)}
              {days !== null && !reached ? ` · ${days > 0 ? `${days}d left` : days === 0 ? "Due today" : "Overdue"}` : ""}
            </p>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex size-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary active:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={`Actions for ${goal.name}`}
            >
              <MoreHorizontal className="size-4" aria-hidden="true" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => onEdit(goal)}>
              <Pencil className="size-4" aria-hidden="true" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onSelect={() => onDeleteRequest(goal)}>
              <Trash2 className="size-4" aria-hidden="true" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mt-3">
        <div className="flex items-baseline justify-between gap-3">
          <p className="truncate font-mono text-lg font-semibold tabular-nums">
            {usd.format(goal.currentUsd)}
            <span className="ml-1 text-xs font-medium text-muted-foreground">/ {usd.format(goal.targetUsd)}</span>
          </p>
          <span className="shrink-0 text-sm font-semibold tabular-nums" style={{ color: goal.color }}>
            {pct}%
          </span>
        </div>
        <div className="mt-2">
          <FinanceProgress value={pct} label={`${goal.name} is ${pct}% saved`} color={goal.color} />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {reached ? "Target reached" : `${usd.format(remainingUsd)} remaining`}
        </p>
      </div>

      {goal.note && <p className="mt-2 text-xs italic text-muted-foreground">{goal.note}</p>}

      <div className="mt-3">
        <Button variant="outline" size="sm" className="min-h-11" onClick={() => onContribute(goal)}>
          <Plus />
          Add contribution
        </Button>
      </div>
    </div>
  );
}
