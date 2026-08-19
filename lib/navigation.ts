import {
  Bell,
  Goal,
  GraduationCap,
  Home,
  ListTodo,
  Repeat,
  ShieldCheck,
  WalletCards,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  id: string;
  href: string;
  label: string;
  /** Compact label for the mobile bottom bar. */
  shortLabel?: string;
  description?: string;
  icon: LucideIcon;
  color?: string;
  /** Nav destination exists in the model but has no route/UI yet. */
  soon?: boolean;
};

export const todayItem: NavItem = {
  id: "today",
  href: "/today",
  label: "Today",
  icon: Home,
  color: "text-amber-500",
};

export const tasksItem: NavItem = {
  id: "tasks",
  href: "/tasks",
  label: "Tasks",
  icon: ListTodo,
  color: "text-sky-500",
};

export const goalsItem: NavItem = {
  id: "goals",
  href: "/goals",
  label: "Goals",
  icon: Goal,
  color: "text-violet-500",
};

export const habitsItem: NavItem = {
  id: "habits",
  href: "/habits",
  label: "Habits",
  icon: Repeat,
  color: "text-emerald-500",
};

export const financeItem: NavItem = {
  id: "finance",
  href: "/finance",
  label: "Finance",
  icon: WalletCards,
  color: "text-teal-500",
};

export const learnItem: NavItem = {
  id: "learn",
  href: "/learning",
  label: "Learn",
  icon: GraduationCap,
  color: "text-indigo-500",
};

export const remindersItem: NavItem = {
  id: "reminders",
  href: "/reminders",
  label: "Reminders",
  icon: Bell,
  color: "text-rose-500",
  soon: true,
};

export const accountItem: NavItem = {
  id: "account",
  href: "/account/security",
  label: "Account",
  icon: ShieldCheck,
  color: "text-zinc-500",
};

/** Primary destinations, in the order the product nav should present them. */
export const primaryNavItems: NavItem[] = [
  todayItem,
  tasksItem,
  goalsItem,
  habitsItem,
  financeItem,
  learnItem,
  remindersItem,
];

export const allNavItems: NavItem[] = [...primaryNavItems, accountItem];

/** Mobile bottom bar: the four most-used destinations; everything else lives in "More". */
export const bottomTabs: NavItem[] = [todayItem, tasksItem, goalsItem, financeItem];

export const moreItems: NavItem[] = [habitsItem, learnItem, remindersItem, accountItem];

export function linkPath(href: string): string {
  const qIndex = href.indexOf("?");
  return qIndex === -1 ? href : href.slice(0, qIndex);
}

export function isNavigationItemActive({
  pathname,
  item,
}: {
  pathname: string;
  item: NavItem;
}): boolean {
  const path = linkPath(item.href);
  if (path === "/") return pathname === "/";
  return pathname === path || pathname.startsWith(`${path}/`);
}

export function getActiveNavItem(pathname: string): NavItem | undefined {
  return allNavItems.find((item) => isNavigationItemActive({ pathname, item }));
}

export function getActiveBottomTabIndex(pathname: string): number {
  return bottomTabs.findIndex((item) => isNavigationItemActive({ pathname, item }));
}

/** A route is a "detail" view when it sits below a top-level nav destination. */
export function isDetailRoute(pathname: string): boolean {
  return !allNavItems.some((item) => linkPath(item.href) === pathname);
}
