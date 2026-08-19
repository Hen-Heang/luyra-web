import { ensureAppUser } from "@/lib/auth/ensure-app-user";
import { getTodaySummary } from "@/lib/services/today-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QuickAddTask } from "@/components/today/quick-add-task";
import { TaskRow } from "@/components/today/task-row";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default async function TodayPage() {
  const appUser = await ensureAppUser();
  const today = await getTodaySummary(appUser.id);

  const overdueCount = today.tasks.items.filter(
    (task) => task.dueDate && new Date(task.dueDate) < new Date(new Date().toDateString())
  ).length;

  const dateLabel = new Date(today.date).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{greeting()}</h1>
        <p className="text-sm text-muted-foreground">{dateLabel}</p>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Tasks</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              {today.tasks.total} remaining
              {overdueCount > 0 ? ` · ${overdueCount} overdue` : ""}
            </p>
          </div>
          <QuickAddTask />
        </CardHeader>
        <CardContent>
          {today.tasks.items.length === 0 ? (
            <p className="py-4 text-sm text-muted-foreground">
              Nothing due today. Add a task to get started.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {today.tasks.items.map((task) => (
                <TaskRow key={task.id} task={task} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
