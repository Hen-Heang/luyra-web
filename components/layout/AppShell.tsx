"use client";

import { useCallback, useState } from "react";
import { usePathname } from "next/navigation";

import { TooltipProvider } from "@/components/ui/tooltip";
import { useMobileKeyboard } from "@/hooks/useMobileKeyboard";
import { useNavigationMode } from "@/hooks/useNavigationMode";
import { useSidebarState } from "@/hooks/useSidebarState";
import { cn } from "@/lib/utils";

import { QuickAddTransaction } from "@/components/finance/transactions/quick-add-transaction";

import { DesktopHeader } from "./DesktopHeader";
import { DesktopSidebar } from "./DesktopSidebar";
import { MobileBottomNav } from "./MobileBottomNav";
import { MobileHeader } from "./MobileHeader";
import { MobileHeaderTitleProvider } from "./mobile-header-title";
import { MoreNavigationSheet } from "./MoreNavigationSheet";
import { TabletNavigationRail } from "./TabletNavigationRail";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const mode = useNavigationMode();
  const isKeyboardOpen = useMobileKeyboard();
  const { collapsed, toggle } = useSidebarState();
  // The More sheet is pinned to the route it was opened on, so navigating
  // closes it by derivation — no effect, no stale-open sheet after a back swipe.
  const [more, setMore] = useState<{ open: boolean; route: string }>({ open: false, route: pathname });
  const moreOpen = more.open && more.route === pathname;
  const setMoreOpen = useCallback((open: boolean) => setMore({ open, route: pathname }), [pathname]);

  const isMobile = mode === "mobile";
  // Unmounted (not just hidden) when the keyboard is up, so nothing inside
  // stays focusable behind the keyboard.
  const showBottomNav = isMobile && !isKeyboardOpen;

  return (
    <TooltipProvider delayDuration={200}>
      <MobileHeaderTitleProvider>
        <a
          href="#main-content"
          className="fixed left-4 top-4 z-[100] -translate-y-20 rounded-lg bg-foreground px-4 py-2 text-sm font-semibold text-background shadow-lg transition-transform focus:translate-y-0"
        >
          Skip to content
        </a>

        <div className="flex min-h-[100dvh] bg-background">
          {mode === "desktop" && <DesktopSidebar pathname={pathname} collapsed={collapsed} onToggleCollapsed={toggle} />}
          {mode === "tablet" && <TabletNavigationRail pathname={pathname} />}

          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            {!isMobile && <DesktopHeader pathname={pathname} />}
            {isMobile && <MobileHeader pathname={pathname} />}

            <main
              id="main-content"
              tabIndex={-1}
              className={cn(
                "min-h-0 flex-1 overflow-x-clip px-4 pt-5 outline-none sm:px-6 lg:px-8",
                showBottomNav ? "pb-[calc(9rem+env(safe-area-inset-bottom))]" : "pb-10"
              )}
            >
              <div className="mx-auto w-full max-w-6xl">{children}</div>
            </main>
          </div>
        </div>

        {showBottomNav && (
          <MobileBottomNav onOpenMore={() => setMoreOpen(true)} moreOpen={moreOpen} pathname={pathname} />
        )}

        {!isKeyboardOpen && <QuickAddTransaction raised={isMobile} />}

        <MoreNavigationSheet open={moreOpen} onOpenChange={setMoreOpen} pathname={pathname} />
      </MobileHeaderTitleProvider>
    </TooltipProvider>
  );
}
