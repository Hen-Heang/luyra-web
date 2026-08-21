"use client";

import Link from "next/link";
import { Menu } from "lucide-react";

import { bottomTabs, getActiveBottomTabIndex } from "@/lib/navigation";
import { cn } from "@/lib/utils";

const TAB =
  "relative flex min-h-11 min-w-0 flex-1 items-center justify-center rounded-xl py-2.5 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset active:scale-95";

/**
 * The core money-flow destinations plus a "More" slot for everything else —
 * a Telegram-style tab strip on an iOS "glass" (frosted, translucent) bar.
 * When the soft keyboard is open the whole element is unmounted by `AppShell`
 * rather than hidden, so nothing inside stays in the tab order.
 */
export function MobileBottomNav({
  pathname,
  onOpenMore,
  moreOpen,
}: {
  pathname: string;
  onOpenMore: () => void;
  moreOpen: boolean;
}) {
  const activeIndex = getActiveBottomTabIndex(pathname);
  const moreActive = activeIndex === bottomTabs.length;

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 pb-[env(safe-area-inset-bottom)]"
    >
      {/* Frosted glass bar: translucent background + backdrop blur + a hairline
          highlight on top, so content scrolling underneath shows through like
          the iOS tab bar / Telegram's bottom nav. */}
      <div className="relative border-t border-white/15 bg-background/70 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] backdrop-blur-xl backdrop-saturate-150 supports-[backdrop-filter]:bg-background/60 dark:border-white/10 dark:bg-background/50">
        <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent dark:via-white/15" />

        <ul className="mx-auto flex max-w-lg items-stretch gap-0.5 px-2 py-1.5">
          {bottomTabs.map((item, index) => {
            const active = index === activeIndex;
            const Icon = item.icon;
            return (
              <li key={item.id} className="flex min-w-0 flex-1">
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  aria-label={item.shortLabel ?? item.label}
                  className={cn(TAB, active ? "text-primary" : "text-muted-foreground")}
                >
                  <Icon size={26} strokeWidth={active ? 2.4 : 2} aria-hidden className={cn("shrink-0", item.color, !active && "opacity-70")} />
                </Link>
              </li>
            );
          })}

          <li className="flex min-w-0 flex-1">
            <button
              type="button"
              onClick={onOpenMore}
              aria-haspopup="dialog"
              aria-expanded={moreOpen}
              aria-label="More"
              className={cn(TAB, moreActive ? "text-primary" : "text-muted-foreground")}
            >
              <Menu size={26} strokeWidth={moreActive ? 2.4 : 2} aria-hidden className={cn("shrink-0", !moreActive && "opacity-70")} />
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
}
