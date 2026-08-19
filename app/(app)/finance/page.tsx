import { MoneyFlowDashboard } from "@/components/finance/money-flow-dashboard";

export default function FinancePage() {
  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-muted-foreground">
        A read-only overview of your Money Flow data this month.
      </p>
      <MoneyFlowDashboard />
    </div>
  );
}
