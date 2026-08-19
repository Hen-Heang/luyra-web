import Link from "next/link";
import { Goal, GraduationCap, Home, ListTodo, ShieldCheck, WalletCards } from "lucide-react";
import { LogoutButton } from "@/components/logout-button";

const NAV_ITEMS = [
  { href: "/today", label: "Today", icon: Home },
  { href: "/tasks", label: "Tasks", icon: ListTodo },
  { href: "/goals", label: "Goals", icon: Goal },
  { href: "/finance", label: "Finance", icon: WalletCards },
  { href: "/learning", label: "Learning", icon: GraduationCap },
  { href: "/account/security", label: "Account", icon: ShieldCheck },
];

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
        <nav className="flex gap-1 overflow-x-auto border-b border-border px-3 py-2 md:hidden">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-foreground hover:bg-secondary"
            >
              <Icon className="size-3.5" />
              {label}
            </Link>
          ))}
        </nav>

        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
