"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getPreferences, updatePreferences } from "@/lib/api/finance";

export function FinanceSettingsForm() {
  const [monthlyLimit, setMonthlyLimit] = useState("");
  const [targetRate, setTargetRate] = useState("20");
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const preferences = await getPreferences();
        if (!active) return;
        setMonthlyLimit(preferences.monthlySpendingLimitKrw != null ? String(preferences.monthlySpendingLimitKrw) : "");
        setTargetRate(String(preferences.targetSavingsRate));
      } catch {
        if (active) setError("Couldn't load your finance settings.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setSaved(false);
    try {
      await updatePreferences({
        monthlySpendingLimitKrw: monthlyLimit.trim() === "" ? null : Number(monthlyLimit),
        targetSavingsRate: Number(targetRate),
      });
      setSaved(true);
    } catch {
      setError("Couldn't save your settings. Try again.");
    } finally {
      setPending(false);
    }
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading settings…</p>;

  return (
    <form onSubmit={handleSubmit} className="flex max-w-sm flex-col gap-4">
      <div className="space-y-1.5">
        <Label htmlFor="monthly-limit">Monthly spending limit (KRW)</Label>
        <Input
          id="monthly-limit"
          type="number"
          min="0"
          step="1000"
          placeholder="No limit"
          value={monthlyLimit}
          onChange={(e) => setMonthlyLimit(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="target-savings-rate">Target savings rate (%)</Label>
        <Input
          id="target-savings-rate"
          type="number"
          min="0"
          max="100"
          value={targetRate}
          onChange={(e) => setTargetRate(e.target.value)}
        />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      {saved && !error && <p className="text-xs text-emerald-600">Saved.</p>}
      <Button type="submit" size="sm" disabled={pending} className="self-start">
        {pending ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}
