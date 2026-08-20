# Finance UI parity

This audit compares the current `money-flow` reference checkout with the native
HeangOS Finance routes. Money Flow is treated only as a UX and interaction
reference. HeangOS authentication, API routes, services, repositories, and Neon
tables remain authoritative.

Status meanings:

- `MATCH`: the HeangOS experience covers the useful Money Flow behavior.
- `PARTIAL`: the route works, but important hierarchy or interactions differ.
- `MISSING`: the behavior is absent.
- `DEFERRED`: intentionally postponed because the supporting domain is absent or
  outside the current screen.
- `NOT_NEEDED`: intentionally excluded from native HeangOS Finance.

| Area | Money Flow source | HeangOS destination | Feature | UX status | Backend status | Action |
|------|-------------------|----------------------|---------|-----------|----------------|--------|
| Finance shell | `components/layout/Sidebar.tsx`, `TabBar.tsx`, `NavShell.tsx` | `app/(app)/finance/layout.tsx` inside the HeangOS `AppShell` | Global navigation | NOT_NEEDED | NOT_NEEDED | Keep the HeangOS shell and only adapt Finance content. |
| Finance navigation | Money Flow top-level routes | `app/(app)/finance/layout.tsx` | Overview, Transactions, Budgets, Savings, Analytics, Review, Subscriptions, Settings | MATCH | DONE | Keep one Finance module with native subroutes. |
| Overview summary | `dashboard/components/SummaryCards.tsx` | `/finance` | Income, expense, net cash flow, savings rate | MATCH | DONE | Implemented with native aggregates, month controls, amount hierarchy, and semantic states. |
| Overview daily budget | `dashboard/components/DailyBudgetPill.tsx` | `/finance` | Today spend, remaining monthly budget, daily guide | MATCH | DONE | Implemented in the native service using current-month budget and daily spending data. |
| Overview budget alerts | `dashboard/components/BudgetAlerts.tsx` | `/finance` | 80%, 90%, and exceeded states | MATCH | DONE | Implemented with Watch, Near limit, and Exceeded labels plus accessible progress. |
| Overview categories | `dashboard/components/CategoriesPanel.tsx` | `/finance` | Category icon, spend, share, and budget relationship | MATCH | DONE | Implemented with native category metadata, expense share, and budget usage. |
| Overview trends | `dashboard/components/TrendsPanel.tsx` | `/finance` | Daily spending trend | MATCH | DONE | Implemented with a native daily aggregate and dependency-free accessible SVG chart. |
| Overview recent activity | `dashboard/components/RecentActivity.tsx` | `/finance` | Recent transaction hierarchy and View all link | MATCH | DONE | Implemented through native camel-case DTOs and `/finance/transactions`. |
| Overview review prompt | `dashboard/components/BudgetReviewPrompt.tsx` | `/finance` | Monthly review entry point | MATCH | DONE | Implemented when the selected month contains finance activity. |
| Overview deterministic insight | `dashboard/components/Intelligence.tsx` | `/finance` | Forecast and savings-rate guidance | DEFERRED | PARTIAL | Revisit after comparison/forecast fields are part of the native domain response. |
| AI Money Coach | `dashboard/components/MoneyCoach.tsx` | `/finance` | Generated recommendations and actions | DEFERRED | MISSING | Do not port AI endpoints, generated copy, or browser Supabase mutations. |
| Dashboard quick add | `dashboard/components/Intelligence.tsx`, `AddTransactionSheet/**` | `/finance` | Template/quick transaction entry | DEFERRED | PARTIAL | Handle with the Transactions screen review; do not copy AI quick-add or templates yet. |
| Transaction list | `transactions/page.tsx`, `TransactionGroupList.tsx` | `/finance/transactions` | Compact rows, date groups, aligned amounts | PARTIAL | DONE | Add date grouping and the richer Money Flow row hierarchy. |
| Transaction search and filters | `SearchBar.tsx`, `FilterPanel.tsx`, `useTransactionFilters.ts` | `/finance/transactions` | Search, type, date, category, amount, sort | PARTIAL | PARTIAL | Preserve native server search/type/pagination; add supported filters without client-only fake filtering. |
| Add/edit transaction | `components/transactions/AddTransactionSheet/**` | `/finance/transactions` | Mobile sheet, amount-first form, category and payment method | PARTIAL | DONE | Adapt only DTO-supported fields to the native API. |
| Swipe transaction actions | `components/transactions/SwipeableRow.tsx` | `/finance/transactions` | Safe mobile edit/delete with visible alternatives | MISSING | DONE | Port as an optional enhancement with keyboard and desktop menus. |
| Recurring rules | `components/transactions/RecurringSheet.tsx` | `/finance/transactions` | Create and manage recurrence | DEFERRED | MISSING | Do not port the old recurring backend; expose no fake success path. |
| Budget overview | `budget/page.tsx` | `/finance/budgets` | Total budget, spent, remaining, warning count | PARTIAL | DONE | Port the compact summary hierarchy and status text. |
| Budget category cards | `budget/page.tsx` | `/finance/budgets` | Progress, remaining, healthy/watch/near/exceeded | PARTIAL | DONE | Upgrade native rows and retain API-backed add/edit/remove. |
| Category types | `components/budget/CategoryTypesSheet.tsx` | `/finance/budgets` | Spending class assignment | DEFERRED | MISSING | Do not port browser Supabase category classification without a native domain. |
| Merchant aliases | `components/budget/MerchantNamesSheet.tsx` | `/finance/budgets`, `/finance/subscriptions` | Suggested and confirmed merchant groups | DEFERRED | MISSING | Keep exact-description subscription detection until a native alias domain exists. |
| Savings summary | `savings/page.tsx` | `/finance/savings` | Total saved and overall progress | MISSING | DONE | Add the Money Flow summary hierarchy using native savings goals. |
| Savings goal cards | `savings/page.tsx` | `/finance/savings` | Progress, remaining, target date, actions | PARTIAL | DONE | Upgrade card hierarchy while retaining native goal and contribution APIs. |
| Savings coach and auto-plan | `SavingsCoach.tsx` | `/finance/savings` | Generated plan and automatic deposits | DEFERRED | MISSING | Do not port AI or unsupported automation. |
| Analytics monthly view | `analytics/MonthlyView.tsx` | `/finance/analytics` | Selected-month summary | PARTIAL | DONE | Improve hierarchy and month comparison after Overview. |
| Analytics trends | `analytics/TrendsView.tsx` | `/finance/analytics` | Income vs expense, net flow, categories, payment methods, forecast | PARTIAL | PARTIAL | Add only questions supported by native historical aggregates. |
| Monthly review | `review/page.tsx` | `/finance/review` | Totals, prior month, category and budget performance | PARTIAL | DONE | Port the richer review hierarchy using deterministic native calculations. |
| Review recommendations | `review/page.tsx` | `/finance/review` | Apply next-month recommendations | DEFERRED | MISSING | Do not port direct Supabase writes or generated plans. |
| Subscriptions summary | `subscriptions/page.tsx` | `/finance/subscriptions` | Monthly/yearly recurring cost | PARTIAL | DONE | Upgrade the visual summary using native detection results. |
| Subscription decisions | `subscriptions/page.tsx` | `/finance/subscriptions` | Keep, review, plan to cancel, cancelled | PARTIAL | DONE | Preserve native status updates and improve accessible state presentation. |
| Finance settings | supported parts of `settings/**` | `/finance/settings` | Spending limit and target savings rate | PARTIAL | DONE | Port Finance-only hierarchy; keep account, auth, appearance, AI, and Telegram settings global/out of scope. |
| Loading, empty, error | route `loading.tsx` files and page states | all `/finance/**` routes | Four explicit screen states | PARTIAL | NOT_NEEDED | Standardize meaningful Finance states route by route. |

## Dashboard component decisions

| Money Flow component | Classification | Native Finance decision |
|----------------------|----------------|-------------------------|
| `SummaryCards` | Presentational with parent-provided totals | Adapt the hierarchy; replace Framer Motion and Money Flow formatting with HeangOS primitives. |
| `DailyBudgetPill` | Presentational; parent owns deterministic math | Adapt the presentation and calculate the values in the HeangOS Finance service. |
| `BudgetAlerts` | Presentational with navigation/dismiss state | Adapt from native `BudgetPerformance`; use `/finance/budgets`. |
| `BudgetReviewPrompt` | Presentational with local dismissal logic | Adapt as a native monthly-review entry point; no Money Flow storage key. |
| `CategoriesPanel` | Presentational but Recharts-dependent | Adapt the category hierarchy; use a lightweight native visualization for Overview. |
| `AnalyticsTabs` | Presentational interaction plus lazy chart loading | Do not copy the dashboard tab-within-tab structure into Finance Overview. |
| `TrendsPanel` | Presentational and Recharts-dependent | Adapt the daily trend with native aggregate data; avoid a dependency until richer Analytics needs it. |
| `RecentActivity` | Presentational with Money Flow transaction shape | Adapt through native camel-case Finance DTOs and native route links. |
| `Intelligence` | Deterministic calculations plus unsupported quick-add templates | Defer forecast copy and quick add until the native response/Transactions work supports them. |
| `MoneyCoach` | AI endpoints, persisted insight actions, and direct Supabase budget writes | Do not port. |

## Current-session boundary

This session implements only `/finance` Overview and the minimum native
aggregate fields it needs. All rows for Transactions and later screens remain
audit findings for subsequent step-by-step reviews.

The Overview implementation adds no third-party dependency. AI Money Coach,
Money Flow authentication, browser Supabase CRUD, quick-add templates, and the
Money Flow application shell remain intentionally excluded.
