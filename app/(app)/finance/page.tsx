import { FinanceOverview } from "@/components/finance/finance-overview";

export default function FinancePage() {
  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-muted-foreground">A quick look at this month.</p>
      <FinanceOverview />
    </div>
  );
}
