import { Badge } from "@/components/ui/badge";
import type { Task } from "@/types/task";

const PRIORITY_VARIANT = {
  high: "destructive",
  medium: "warning",
  low: "outline",
} as const;

function formatDueDate(dueDate: string | null): string | null {
  if (!dueDate) return null;

  const date = new Date(dueDate);
  const isOverdue = date < new Date(new Date().toDateString());

  const label = date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return isOverdue ? `Overdue · ${label}` : label;
}

export function TaskRow({ task }: { task: Task }) {
  const dueLabel = formatDueDate(task.dueDate);
  const isOverdue = dueLabel?.startsWith("Overdue");

  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <span className="text-sm">{task.title}</span>
      <div className="flex items-center gap-2">
        {dueLabel && (
          <span className={isOverdue ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>
            {dueLabel}
          </span>
        )}
        {task.priority && (
          <Badge variant={PRIORITY_VARIANT[task.priority]}>{task.priority}</Badge>
        )}
      </div>
    </div>
  );
}
