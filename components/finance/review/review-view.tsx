"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarClock, Settings2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { FinanceEmptyState, FinanceErrorState, FinanceMetricCard, FinanceSection, MonthSelector } from "@/components/finance/ui/finance-primitives";
import { ReviewSummaryCards } from "@/components/finance/review/review-summary";
import { ReviewBudgetPerformance } from "@/components/finance/review/review-budget-performance";
import { ReviewCategoryChanges } from "@/components/finance/review/review-category-changes";
import { ReviewSavingsProgressCard } from "@/components/finance/review/review-savings-progress";
import { ReviewObservations } from "@/components/finance/review/review-observations";
import { getPreferences, getReviewSummary } from "@/lib/api/finance";
import { krw } from "@/lib/finance-format";
import { monthKey, monthLabel } from "@/lib/finance-month";
import type { ReviewSummary } from "@/types/finance";

function ReviewLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading monthly review">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((card) => (
          <div key={card} className="h-28 rounded-2xl bg-secondary motion-safe:animate-pulse" />
        ))}
      </div>
      <div className="h-56 rounded-2xl bg-secondary motion-safe:animate-pulse" />
      <div className="h-56 rounded-2xl bg-secondary motion-safe:animate-pulse" />
    </div>
  );
}

// Defaults to last month — a review of the month still in progress isn't
// meaningful yet, same reasoning Money Flow's review page uses.
export function ReviewView() {
  const [monthOffset, setMonthOffset] = useState(-1);
  const [refreshKey, setRefreshKey] = useState(0);
  const requestKey = `${monthOffset}:${refreshKey}`;
  const [result, setResult] = useState<{ key: string; summary: ReviewSummary | null; error: string | null }>({
    key: "",
    summary: null,
    error: null,
  });
  const [reviewEnabled, setReviewEnabled] = useState<boolean | null>(null);
  const loading = result.key !== requestKey;
  const summary = loading ? null : result.summary;
  const error = loading ? null : result.error;

  useEffect(() => {
    let active = true;
    void getReviewSummary(monthKey(monthOffset))
      .then((data) => {
        if (active) setResult({ key: requestKey, summary: data, error: null });
      })
      .catch(() => {
        if (active) {
          setResult({ key: requestKey, summary: null, error: "We couldn't load the monthly review. Try again in a moment." });
        }
      });
    return () => {
      active = false;
    };
  }, [monthOffset, requestKey]);

  useEffect(() => {
    let active = true;
    void getPreferences()
      .then((preferences) => {
        if (active) setReviewEnabled(preferences.monthlyReviewEnabled);
      })
      .catch(() => {
        if (active) setReviewEnabled(true);
      });
    return () => {
      active = false;
    };
  }, []);

  if (reviewEnabled === false) {
    return (
      <FinanceEmptyState
        icon={Settings2}
        title="Monthly review is turned off"
        description="Turn it back on in Finance Settings to see this month's review."
        action={
          <Link href="/finance/settings" className={buttonVariants({ variant: "outline", size: "sm" })}>
            Open Finance Settings
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">How this month went</p>
        </div>
        <MonthSelector
          label={monthLabel(monthOffset)}
          onPrevious={() => setMonthOffset((offset) => offset - 1)}
          onNext={() => setMonthOffset((offset) => offset + 1)}
          nextDisabled={monthOffset >= 0}
          ariaLabel="Review month selector"
        />
      </div>

      {error ? (
        <FinanceErrorState title="Review unavailable" description={error} onRetry={() => setRefreshKey((key) => key + 1)} />
      ) : loading || !summary ? (
        <ReviewLoading />
      ) : summary.totals.transactionCount === 0 ? (
        <FinanceEmptyState
          icon={CalendarClock}
          title={`Nothing recorded for ${monthLabel(monthOffset)}`}
          description="Add income or expenses in Transactions to build a review for this month."
          action={
            <Link href="/finance/transactions" className={buttonVariants({ variant: "outline", size: "sm" })}>
              Open Transactions
            </Link>
          }
        />
      ) : (
        <>
          <ReviewSummaryCards totals={summary.totals} />

          <FinanceSection id="review-budgets" title="Budget performance" description="How each budgeted category tracked this month.">
            <ReviewBudgetPerformance budgets={summary.budgetPerformance} />
          </FinanceSection>

          <FinanceSection id="review-category-changes" title="Where spending changed" description={`Largest swings vs. ${monthLabel(monthOffset - 1)}.`}>
            <ReviewCategoryChanges categoryComparison={summary.categoryComparison} />
          </FinanceSection>

          <FinanceSection id="review-subscriptions" title="Subscriptions" description="Estimated recurring cost this month." action={
            <Link href="/finance/subscriptions" className="inline-flex min-h-11 items-center gap-1 text-xs font-semibold text-foreground underline-offset-4 hover:underline">
              View all <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          }>
            <FinanceMetricCard
              label="Active subscriptions"
              value={`${krw.format(summary.subscriptionsMonthlyKrw)}/mo`}
              detail="Estimated recurring cost, excluding cancelled"
              icon={CalendarClock}
            />
          </FinanceSection>

          <FinanceSection id="review-savings" title="Savings progress" description="Combined progress across every savings goal.">
            <ReviewSavingsProgressCard progress={summary.savingsProgress} />
          </FinanceSection>

          <FinanceSection id="review-observations" title="Key observations" description="Deterministic changes worth knowing about — no AI involved.">
            <ReviewObservations observations={summary.observations} />
          </FinanceSection>
        </>
      )}
    </div>
  );
}
