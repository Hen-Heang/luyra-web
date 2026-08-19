"use client";

import Link from "next/link";

import { NavIconRow } from "@/components/layout/NavItem";
import { accountItem, isNavigationItemActive, primaryNavItems, todayItem } from "@/lib/navigation";

import { ProfileMenu } from "./ProfileMenu";

export const RAIL_WIDTH = 80;

/**
 * 768–1199px navigation. Compact icon rail — the mobile bottom bar is never
 * used at these widths.
 */
export function TabletNavigationRail({ pathname }: { pathname: string }) {
  return (
    <aside
      aria-label="Main navigation"
      style={{ width: RAIL_WIDTH }}
      className="sticky top-0 flex h-dvh shrink-0 flex-col border-r border-border bg-sidebar"
    >
      <div className="flex justify-center px-2 py-4">
        <Link
          href={todayItem.href}
          aria-label="HeangOS home"
          className="flex size-11 items-center justify-center rounded-lg bg-primary text-base font-bold text-primary-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          H
        </Link>
      </div>

      <div className="mx-3 h-px bg-border" />

      <nav aria-label="Primary" className="flex-1 space-y-1 overflow-y-auto px-2 py-3">
        {primaryNavItems.map((item) => (
          <NavIconRow key={item.id} item={item} showLabel active={isNavigationItemActive({ pathname, item })} />
        ))}
      </nav>

      <div className="space-y-1 border-t border-border px-2 py-3">
        <NavIconRow item={accountItem} showLabel active={isNavigationItemActive({ pathname, item: accountItem })} />
        <ProfileMenu collapsed side="right" />
      </div>
    </aside>
  );
}
