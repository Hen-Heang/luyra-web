"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef, useState } from "react";
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
  const activeHref = TABS.find((tab) => tab.href === pathname)?.href ?? TABS[0].href;

  const tabRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const [indicator, setIndicator] = useState<{ left: number; width: number } | null>(null);
  // The app header lives outside this layout's subtree and its height varies
  // (mobile vs. desktop, safe-area insets), so the tab bar's sticky offset is
  // measured at runtime rather than hard-coded.
  const [headerHeight, setHeaderHeight] = useState(0);

  useLayoutEffect(() => {
    const el = tabRefs.current[activeHref];
    if (!el) return;

    const update = () => setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
    update();

    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [activeHref]);

  useLayoutEffect(() => {
    const header = document.querySelector("header");
    if (!header) return;

    const update = () => setHeaderHeight(header.getBoundingClientRect().height);
    update();

    const observer = new ResizeObserver(update);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Finance</h1>
      </div>

      <nav
        className="sticky z-20 flex gap-1 overflow-x-auto border-b border-border bg-background/95 backdrop-blur-sm"
        style={{ top: headerHeight }}
      >
        {TABS.map((tab) => {
          const isActive = tab.href === activeHref;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              ref={(el) => {
                tabRefs.current[tab.href] = el;
              }}
              className={cn(
                "flex min-h-11 shrink-0 items-center rounded-t-md px-3 py-2 text-sm transition-colors duration-200",
                isActive ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              )}
            >
              {tab.label}
            </Link>
          );
        })}
        <span
          aria-hidden
          className="absolute bottom-0 h-[2px] rounded-full bg-primary transition-all duration-300 ease-out"
          style={{
            left: indicator?.left ?? 0,
            width: indicator?.width ?? 0,
            opacity: indicator ? 1 : 0,
          }}
        />
      </nav>

      {children}
    </div>
  );
}
