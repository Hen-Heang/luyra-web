import "server-only";
import { countTasksCompletedToday, findTodayTasksByUser } from "@/lib/repositories/task-repository";
import type { TodaySummary } from "@/types/today";

// Goals will join this summary once the Goals milestone lands.
export async function getTodaySummary(userId: string): Promise<TodaySummary> {
  const [items, completed] = await Promise.all([
    findTodayTasksByUser(userId),
    countTasksCompletedToday(userId),
  ]);

  return {
    date: new Date().toISOString().slice(0, 10),
    tasks: {
      total: items.length,
      completed,
      items,
    },
  };
}
