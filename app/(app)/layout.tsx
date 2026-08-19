import Link from "next/link";
import { Home } from "lucide-react";
import { LogoutButton } from "@/components/logout-button";

const NAV_ITEMS = [{ href: "/today", label: "Today", icon: Home }];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-56 flex-col border-r border-border bg-card px-3 py-4 md:flex">
        <div className="px-2 pb-6 text-sm font-semibold tracking-tight">HeangOS</div>
        <nav className="flex flex-1 flex-col gap-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-foreground hover:bg-secondary"
            >
              <Icon className="size-4" />
              {label}
            </Link>
          ))}
        </nav>
        <LogoutButton />
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border px-4 py-3 md:hidden">
          <span className="text-sm font-semibold tracking-tight">HeangOS</span>
          <LogoutButton />
        </header>

        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
