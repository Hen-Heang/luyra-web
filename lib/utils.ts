import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDueDate(dueDate: string | null): string | null {
  if (!dueDate) return null;

  const date = new Date(dueDate);
  const isOverdue = date < new Date(new Date().toDateString());

  const label = date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return isOverdue ? `Overdue · ${label}` : label;
}
