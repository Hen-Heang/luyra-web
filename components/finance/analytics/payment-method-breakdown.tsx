"use client";

import { CreditCard } from "lucide-react";
import { FinanceEmptyState, FinanceProgress } from "@/components/finance/ui/finance-primitives";
import { krw } from "@/lib/finance-format";
import type { PaymentMethodAmount } from "@/types/finance";

// Fixed-order categorical palette (see app/globals.css --chart-series-*).
// Color is assigned by a stable hash of the entity's own id/name, never by
// its rank in the amount-sorted list — so a method keeps its color across
// months even as spending order shifts.
const SERIES_COLORS = [
  "var(--chart-series-1)",
  "var(--chart-series-2)",
  "var(--chart-series-3)",
  "var(--chart-series-4)",
  "var(--chart-series-5)",
  "var(--chart-series-6)",
];
const MAX_VISIBLE_SERIES = SERIES_COLORS.length;

function colorForMethod(id: string | null, name: string): string {
  const key = id ?? name;
  let hash = 0;
  for (let index = 0; index < key.length; index += 1) hash = (hash * 31 + key.charCodeAt(index)) >>> 0;
  return SERIES_COLORS[hash % SERIES_COLORS.length];
}

export function PaymentMethodBreakdown({ paymentMethods }: { paymentMethods: PaymentMethodAmount[] }) {
  if (paymentMethods.length === 0) {
    return (
      <FinanceEmptyState
        icon={CreditCard}
        title="No expenses recorded"
        description="Payment method breakdown appears once you log expenses this month."
      />
    );
  }

  const total = paymentMethods.reduce((sum, method) => sum + method.amountKrw, 0);
  const visible = paymentMethods.slice(0, MAX_VISIBLE_SERIES);
  const overflow = paymentMethods.slice(MAX_VISIBLE_SERIES);
  const overflowAmountKrw = overflow.reduce((sum, method) => sum + method.amountKrw, 0);

  return (
    <div className="space-y-4 rounded-2xl border bg-card p-4">
      {visible.map((method) => {
        const share = total > 0 ? (method.amountKrw / total) * 100 : 0;
        const color = colorForMethod(method.paymentMethodId, method.paymentMethodName);
        return (
          <div key={method.paymentMethodId ?? method.paymentMethodName}>
            <div className="flex items-center justify-between gap-3">
              <span className="flex min-w-0 items-center gap-2 text-sm">
                <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" />
                <span className="truncate">{method.paymentMethodName}</span>
              </span>
              <span className="shrink-0 font-mono text-sm font-medium tabular-nums">{krw.format(method.amountKrw)}</span>
            </div>
            <div className="mt-1.5">
              <FinanceProgress value={share} label={`${method.paymentMethodName} is ${share.toFixed(0)}% of expenses`} color={color} />
            </div>
          </div>
        );
      })}

      {overflow.length > 0 && (
        <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
          <span className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
            <span className="size-2.5 shrink-0 rounded-full bg-muted-foreground/40" aria-hidden="true" />
            Other ({overflow.length})
          </span>
          <span className="shrink-0 font-mono text-sm font-medium tabular-nums text-muted-foreground">{krw.format(overflowAmountKrw)}</span>
        </div>
      )}
    </div>
  );
}
