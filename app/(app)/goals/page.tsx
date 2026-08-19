import Link from "next/link";
import { cn } from "@/lib/utils";
import { ensureAppUser } from "@/lib/auth/ensure-app-user";
import { listGoals } from "@/lib/services/goal-service";
import { goalFiltersSchema } from "@/lib/validation/goal";
import type { GoalStatus } from "@/types/goal";
import { GoalList } from "@/components/goals/goal-list";

const STATUS_TABS: { label: string; value: GoalStatus | undefined }[] = [
  { label: "All", value: undefined },
  { label: "Active", value: "active" },
  { label: "Paused", value: "paused" },
  { label: "Completed", value: "completed" },
];

export default async function GoalsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const filters = goalFiltersSchema.parse({ status: params.status || undefined });

  const appUser = await ensureAppUser();
  const goals = await listGoals(appUser.id, filters);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Goals</h1>

      <div className="flex flex-wrap gap-1">
        {STATUS_TABS.map((tab) => (
          <Link
            key={tab.label}
            href={tab.value ? `/goals?status=${tab.value}` : "/goals"}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm",
              filters.status === tab.value
                ? "bg-secondary font-medium"
                : "text-muted-foreground hover:bg-secondary"
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <GoalList goals={goals} />
    </div>
  );
}
