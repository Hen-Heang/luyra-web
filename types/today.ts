import type { Task } from "@/types/task";

export interface TodaySummary {
  date: string;
  tasks: {
    total: number;
    completed: number;
    items: Task[];
  };
}
