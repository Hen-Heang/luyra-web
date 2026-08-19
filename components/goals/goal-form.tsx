"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createGoal, updateGoal } from "@/lib/api/goals";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Goal, GoalCategory } from "@/types/goal";

const CATEGORIES: { label: string; value: GoalCategory }[] = [
  { label: "Personal", value: "personal" },
  { label: "Career", value: "career" },
  { label: "Finance", value: "finance" },
  { label: "Learning", value: "learning" },
  { label: "Health", value: "health" },
  { label: "Other", value: "other" },
];

export function GoalForm({
  mode,
  goal,
  onDone,
}: {
  mode: "create" | "edit";
  goal?: Goal;
  onDone: () => void;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(goal?.title ?? "");
  const [description, setDescription] = useState(goal?.description ?? "");
  const [category, setCategory] = useState<GoalCategory | "">(goal?.category ?? "");
  const [targetDate, setTargetDate] = useState(goal?.targetDate ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      if (mode === "create") {
        await createGoal({
          title,
          description: description.trim() || undefined,
          category: category || undefined,
          targetDate: targetDate || undefined,
        });
      } else if (goal) {
        await updateGoal(goal.id, {
          title,
          description: description.trim() === "" ? null : description.trim(),
          category: category || null,
          targetDate: targetDate || null,
        });
      }
      router.refresh();
      onDone();
    } catch {
      setError("Couldn't save the goal. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <Input
        autoFocus
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <Input
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <div className="flex gap-2">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as GoalCategory | "")}
          className="h-9 rounded-md border border-input bg-transparent px-2 text-sm"
        >
          <option value="">No category</option>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
          className="h-9 rounded-md border border-input bg-transparent px-2 text-sm"
        />
      </div>
      {error && <span className="text-xs text-destructive">{error}</span>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending || title.trim().length === 0}>
          {mode === "create" ? "Add goal" : "Save"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
