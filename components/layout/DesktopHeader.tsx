"use client";

import { getActiveNavItem } from "@/lib/navigation";

import { ProfileMenu } from "./ProfileMenu";

/** Sticky top bar for tablet + desktop. No HeangOS branding — the sidebar/rail owns that. */
export function DesktopHeader({ pathname }: { pathname: string }) {
  const item = getActiveNavItem(pathname);
  const title = item?.label ?? "HeangOS";

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-border bg-background/90 px-6 py-3 backdrop-blur-sm">
      <div className="min-w-0">
        <h1 className="truncate text-[15px] font-semibold tracking-tight text-foreground">{title}</h1>
        {item?.description && <p className="truncate text-xs text-muted-foreground">{item.description}</p>}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <ProfileMenu collapsed side="bottom" align="end" className="size-11" />
      </div>
    </header>
  );
}
