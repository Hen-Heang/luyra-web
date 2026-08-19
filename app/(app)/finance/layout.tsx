"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/finance", label: "Overview" },
  { href: "/finance/transactions", label: "Transactions" },
  { href: "/finance/budgets", label: "Budgets" },
  { href: "/finance/savings", label: "Savings" },
  { href: "/finance/analytics", label: "Analytics" },
  { href: "/finance/review", label: "Review" },
  { href: "/finance/subscriptions", label: "Subscriptions" },
  { href: "/finance/settings", label: "Settings" },
];

export default function FinanceLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Finance</h1>
      </div>

      <nav className="flex gap-1 overflow-x-auto border-b border-border">
        {TABS.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "shrink-0 px-3 py-2 text-sm",
              pathname === tab.href
                ? "border-b-2 border-primary font-medium text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      {children}
    </div>
  );
}
