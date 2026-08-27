import { FinanceOverview } from "@/components/finance/finance-overview";
import { GreetingHeader } from "@/components/layout/GreetingHeader";
import { ensureAppUser } from "@/lib/auth/ensure-app-user";
import { appMonth } from "@/lib/finance-cron-time";
import { getFinanceOverviewSummary } from "@/lib/services/finance-analytics-service";
import type { FinanceOverviewSummary } from "@/types/finance";

// The summary is fetched on the server so the amounts land in the first paint
// instead of arriving after a client fetch. `appMonth()` pins the prefetched
// month to Asia/Seoul; the client compares it against its own current month
// and falls back to fetching if a traveling browser disagrees. A failed
// prefetch is swallowed on purpose — the client owns the retry and error state,
// so the page degrades to the previous fetch-on-mount behaviour.
export default async function FinancePage() {
  const month = appMonth();
  const appUser = await ensureAppUser();

  let summary: FinanceOverviewSummary | undefined;
  try {
    summary = await getFinanceOverviewSummary(appUser.id, month);
  } catch {
    summary = undefined;
  }

  return (
    <div className="space-y-6 lg:space-y-7">
      <GreetingHeader user={appUser} />
      <FinanceOverview initialMonth={month} initialSummary={summary} />
    </div>
  );
}
