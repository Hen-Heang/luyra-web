"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GoalForm } from "@/components/goals/goal-form";
import { GoalCard } from "@/components/goals/goal-card";
import type { Goal } from "@/types/goal";

export function GoalList({ goals }: { goals: Goal[] }) {
  const [creating, setCreating] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      {creating ? (
        <div className="rounded-lg border border-border p-4">
          <GoalForm mode="create" onDone={() => setCreating(false)} />
        </div>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setCreating(true)} className="self-start">
          <Plus />
          New goal
        </Button>
      )}

      {goals.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">No goals match this filter.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
        </div>
      )}
    </div>
  );
}
