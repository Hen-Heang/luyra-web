"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CreateSavingsGoalInput, UpdateSavingsGoalInput } from "@/lib/validation/finance";
import type { SavingsGoal } from "@/types/finance";

const ICONS = ["💰", "✈️", "🏠", "🚗", "🎓", "💻", "🎁", "🏖️"];
const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export function SavingsGoalForm({
  mode,
  goal,
  onSave,
  onCancel,
}: {
  mode: "create" | "edit";
  goal?: SavingsGoal;
  onSave: (input: CreateSavingsGoalInput & UpdateSavingsGoalInput) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(goal?.name ?? "");
  const [icon, setIcon] = useState(goal?.icon ?? ICONS[0]);
  const [color, setColor] = useState(goal?.color ?? COLORS[0]);
  const [targetUsd, setTargetUsd] = useState(goal ? String(goal.targetUsd) : "");
  const [deadline, setDeadline] = useState(goal?.deadline ?? "");
  const [note, setNote] = useState(goal?.note ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const target = Number(targetUsd);
    if (!Number.isFinite(target) || target < 0) {
      setError("Enter a valid target amount.");
      return;
    }
    if (name.trim().length === 0) {
      setError("Name is required.");
      return;
    }

    setPending(true);
    setError(null);
    try {
      await onSave({
        name: name.trim(),
        icon,
        color,
        targetUsd: target,
        currentUsd: goal?.currentUsd ?? 0,
        deadline: deadline || null,
        note: note.trim() || null,
      });
    } catch {
      setError("Couldn't save the goal. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <select
          value={icon}
          onChange={(e) => setIcon(e.target.value)}
          className="h-9 rounded-md border border-input bg-transparent px-2 text-lg"
        >
          {ICONS.map((i) => (
            <option key={i} value={i}>
              {i}
            </option>
          ))}
        </select>
        <Input autoFocus placeholder="Goal name" value={name} onChange={(e) => setName(e.target.value)} required className="flex-1" />
      </div>
      <div className="flex gap-2">
        <Input
          type="number"
          min="0"
          step="0.01"
          placeholder="Target (USD)"
          value={targetUsd}
          onChange={(e) => setTargetUsd(e.target.value)}
          required
          className="flex-1"
        />
        <input
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          className="h-9 rounded-md border border-input bg-transparent px-2 text-sm"
        />
      </div>
      <div className="flex gap-1.5">
        {COLORS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setColor(c)}
            aria-label={`Color ${c}`}
            aria-pressed={color === c}
            className="size-6 shrink-0 rounded-full transition-transform"
            style={{ backgroundColor: c, outline: color === c ? `2px solid ${c}` : "none", outlineOffset: 2 }}
          />
        ))}
      </div>
      <Input placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
      {error && <span className="text-xs text-destructive">{error}</span>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {mode === "create" ? "Add goal" : "Save"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
