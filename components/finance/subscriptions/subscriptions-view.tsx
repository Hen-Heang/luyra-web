"use client";

import { useCallback, useEffect, useState } from "react";
import { Repeat } from "lucide-react";
import { listDetectedSubscriptions, setSubscriptionStatus } from "@/lib/api/finance";
import { krw } from "@/lib/finance-format";
import { cn } from "@/lib/utils";
import type { DetectedSubscription, SubscriptionStatus } from "@/types/finance";

const STATUS_OPTIONS: { value: SubscriptionStatus; label: string }[] = [
  { value: "keep", label: "Keep" },
  { value: "review", label: "Review" },
  { value: "plan_to_cancel", label: "Plan to cancel" },
  { value: "cancelled", label: "Cancelled" },
];

const FREQUENCY_LABEL: Record<DetectedSubscription["frequency"], string> = {
  monthly: "Monthly",
  yearly: "Yearly",
  irregular: "Irregular",
};

// Detected straight from repeated transaction descriptions (see
// lib/services/finance-subscription-service.ts) — simplified from Money
// Flow's merchant-alias-grouping version, no fuzzy name matching.
export function SubscriptionsView() {
  const [subscriptions, setSubscriptions] = useState<DetectedSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setSubscriptions(await listDetectedSubscriptions());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load subscriptions.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, [load]);

  async function updateStatus(subscription: DetectedSubscription, status: SubscriptionStatus) {
    if (subscription.status === status) return;
    setSavingKey(subscription.key);
    setSubscriptions((prev) => prev.map((s) => (s.key === subscription.key ? { ...s, status } : s)));
    try {
      await setSubscriptionStatus(subscription.key, { displayName: subscription.name, status });
      setError(null);
    } catch {
      setSubscriptions((prev) => prev.map((s) => (s.key === subscription.key ? { ...s, status: subscription.status } : s)));
      setError("Couldn't save that change.");
    } finally {
      setSavingKey(null);
    }
  }

  const monthlyTotal = subscriptions
    .filter((s) => s.status !== "cancelled")
    .reduce((sum, s) => sum + Math.round(s.estimatedYearlyCostKrw / 12), 0);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Detected from repeated payments in your transactions over the last 6 months. HeangOS never cancels
        anything for you — this is a note to yourself.
      </p>

      {subscriptions.length > 0 && (
        <div className="rounded-lg border border-border p-4">
          <p className="text-xs font-medium text-muted-foreground">Estimated recurring cost</p>
          <p className="mt-1 text-xl font-semibold">{krw.format(monthlyTotal)}/mo</p>
        </div>
      )}

      {error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading subscriptions…</p>
      ) : subscriptions.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-card/30 px-4 py-10 text-center">
          <div className="flex size-12 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
            <Repeat size={24} strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">No recurring payments found</p>
            <p className="mt-1 text-xs text-muted-foreground">Once a payment repeats a couple of times, it shows up here.</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {subscriptions.map((subscription) => (
            <div key={subscription.key} className="rounded-lg border border-border p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3
                    className={cn(
                      "truncate text-sm font-semibold",
                      subscription.status === "cancelled" && "line-through opacity-60"
                    )}
                  >
                    {subscription.name}
                  </h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {FREQUENCY_LABEL[subscription.frequency]} · {subscription.occurrenceCount} payments seen
                    {subscription.categoryName ? ` · ${subscription.categoryName}` : ""}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold">{krw.format(subscription.latestAmountKrw)}</p>
                  <p className="text-xs text-muted-foreground">latest</p>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <span>Average: {krw.format(subscription.averageAmountKrw)}</span>
                <span>Yearly: {krw.format(subscription.estimatedYearlyCostKrw)}</span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {STATUS_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => updateStatus(subscription, option.value)}
                    disabled={savingKey === subscription.key}
                    aria-pressed={subscription.status === option.value}
                    className={cn(
                      "rounded-md border px-2 py-1.5 text-xs font-medium transition-colors disabled:opacity-50",
                      subscription.status === option.value
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-input text-muted-foreground hover:bg-secondary"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
