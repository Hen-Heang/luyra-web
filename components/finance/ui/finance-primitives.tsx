import type { LucideIcon } from "lucide-react";
import { ChevronLeft, ChevronRight, CircleAlert, RefreshCw, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FinanceTone = "neutral" | "positive" | "expense" | "warning";

const TONE_STYLES: Record<FinanceTone, { icon: string; value: string; surface: string }> = {
  neutral: { icon: "bg-secondary text-foreground", value: "text-foreground", surface: "border-border" },
  positive: { icon: "bg-success/10 text-success", value: "text-success", surface: "border-success/20" },
  expense: { icon: "bg-destructive/10 text-destructive", value: "text-destructive", surface: "border-destructive/20" },
  warning: { icon: "bg-warning/10 text-warning", value: "text-warning", surface: "border-warning/20" },
};

export function FinanceSection({ id, title, description, action, children, className }: {
  id: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section aria-labelledby={id} className={cn("space-y-3", className)}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h2 id={id} className="text-sm font-semibold tracking-tight text-foreground">{title}</h2>
          {description ? <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function FinanceMetricCard({ label, value, detail, icon: Icon, tone = "neutral", valueTone, surfaceTone, featured = false }: {
  label: string;
  value: string;
  detail: React.ReactNode;
  icon: LucideIcon;
  tone?: FinanceTone;
  valueTone?: FinanceTone;
  surfaceTone?: FinanceTone;
  featured?: boolean;
}) {
  const styles = TONE_STYLES[tone];
  const valueStyles = TONE_STYLES[valueTone ?? tone];
  const surfaceStyles = TONE_STYLES[surfaceTone ?? tone];
  return (
    <div className={cn("flex h-full min-w-0 flex-col rounded-2xl border bg-card p-4 shadow-sm", featured ? "min-h-44 justify-between sm:p-5" : "gap-4", surfaceStyles.surface)}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl", styles.icon)}>
          <Icon aria-hidden="true" className="size-4" />
        </span>
      </div>
      <div>
        <p className={cn("break-words font-mono font-semibold leading-tight tracking-[-0.04em] tabular-nums", featured ? "text-3xl sm:text-4xl" : "text-lg sm:text-2xl", valueStyles.value)} title={value}>{value}</p>
        <div className="mt-2 text-xs text-muted-foreground">{detail}</div>
      </div>
    </div>
  );
}

export function CategoryIcon({ icon, color, className }: { icon: string | null; color: string | null; className?: string }) {
  return (
    <span
      className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl border text-lg", className)}
      style={{
        backgroundColor: color ? `color-mix(in srgb, ${color} 12%, transparent)` : "var(--secondary)",
        borderColor: color ? `color-mix(in srgb, ${color} 22%, transparent)` : "var(--border)",
        color: color ?? "var(--foreground)",
      }}
      aria-hidden="true"
    >
      {icon ? icon : <WalletCards className="size-4" />}
    </span>
  );
}

export function FinanceProgress({ value, label, tone = "neutral", color }: {
  value: number;
  label: string;
  tone?: FinanceTone;
  color?: string | null;
}) {
  const fillClass = { neutral: "bg-finance-chart", positive: "bg-success", expense: "bg-destructive", warning: "bg-warning" }[tone];
  const safeValue = Number.isFinite(value) ? value : 0;
  const visualValue = Math.min(Math.max(safeValue, 0), 100);
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(visualValue)} className="h-2 overflow-hidden rounded-full bg-secondary">
      <div
        className={cn("h-full rounded-full motion-safe:transition-[width] motion-safe:duration-500", color ? undefined : fillClass)}
        style={{ width: `${visualValue}%`, backgroundColor: color ?? undefined }}
      />
    </div>
  );
}

export function MonthSelector({ label, onPrevious, onNext, nextDisabled, ariaLabel, size = "md" }: {
  label: string;
  onPrevious: () => void;
  onNext: () => void;
  nextDisabled?: boolean;
  ariaLabel: string;
  size?: "sm" | "md";
}) {
  const buttonSize = size === "sm" ? "size-9" : "size-11";
  return (
    <div className="flex min-h-11 items-center rounded-xl border bg-card p-1 shadow-sm" aria-label={ariaLabel}>
      <button
        type="button"
        onClick={onPrevious}
        className={cn("flex items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", buttonSize)}
        aria-label="Previous month"
      >
        <ChevronLeft className="size-4" aria-hidden="true" />
      </button>
      <span className="min-w-32 px-2 text-center text-sm font-semibold tabular-nums">{label}</span>
      <button
        type="button"
        onClick={onNext}
        disabled={nextDisabled}
        className={cn("flex items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-30", buttonSize)}
        aria-label="Next month"
      >
        <ChevronRight className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}

export function FinanceErrorState({ title, description, onRetry }: {
  title: string;
  description: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-start gap-4 rounded-2xl border border-destructive/25 bg-destructive/5 p-5" role="alert">
      <div className="flex items-start gap-3">
        <CircleAlert className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden="true" />
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
        </div>
      </div>
      <Button variant="outline" size="sm" className="min-h-11" onClick={onRetry}>
        <RefreshCw aria-hidden="true" />
        Try again
      </Button>
    </div>
  );
}

export function FinanceEmptyState({ icon: Icon, title, description, action }: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-card/40 px-5 py-10 text-center">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-secondary text-muted-foreground"><Icon className="size-5" aria-hidden="true" /></span>
      <h3 className="mt-4 text-sm font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
