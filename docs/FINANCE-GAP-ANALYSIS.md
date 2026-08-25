# Finance gap analysis

Audit date: 2026-08-26.

Direction of this audit: what the `money-flow` reference checkout
(`E:\Fullstack\money-flow`, v1.2.0) has that Luyra's Finance module does not
yet have. Money Flow is a reference only — Luyra's own auth, API routes,
services, repositories, and Neon tables stay authoritative.

This document complements [FINANCE-UI-PARITY.md](./FINANCE-UI-PARITY.md).
That file is a screen-by-screen UX parity audit; this one is a
backend/infrastructure/feature gap list, with the current code verified
against both trees.

> **The parity doc is partly stale.** `FINANCE-UI-PARITY.md` still marks
> "AI Money Coach" and "Dashboard quick add" as `MISSING`. The Money Coach is
> built (`lib/services/finance-money-coach-service.ts`,
> `components/finance/settings/money-coach-section.tsx`), including the
> Apply-recommendation path. Only the AI-generated *quick transaction entry*
> is still absent. Those rows should be refreshed.

Status meanings used below:

- `MISSING` — no code and no schema.
- `SCHEMA_ONLY` — the table or column exists in `db/migrations/` but nothing
  in `lib/`, `app/`, or `components/` reads or writes it.
- `MANUAL_ONLY` — the behavior works, but only when a human presses a button;
  Money Flow runs it on a schedule.

## 1. Scheduling — nothing runs automatically

Money Flow runs eight Vercel Cron jobs, all gated by
`Authorization: Bearer <CRON_SECRET>` via `lib/server/cron.ts`. Luyra has no
`app/api/cron/**` directory and no `vercel.json` anywhere in the repo.

| Money Flow job | Schedule (UTC) | Purpose | Luyra status |
|---|---|---|---|
| `/api/cron/recurring` | Daily 00:00 | Create due recurring transactions | `MISSING` — no recurring engine |
| `/api/cron/savings` | Daily 00:30 | Send or apply due savings contributions | `MISSING` |
| `/api/cron/budget-alerts` | Daily 10:00 | Alert only on crossing to a higher threshold level | `MISSING` |
| `/api/cron/spending-spike` | Daily 12:00 | Alert when today exceeds 2x the month's daily average | `MISSING` |
| `/api/cron/daily-reminder` | Daily 03:00 + 12:00 | Telegram nudge to log expenses | `MISSING` |
| `/api/cron/weekly-summary` | Monday 00:00 | Weekly financial check-in | `MANUAL_ONLY` |
| `/api/cron/monthly-report` | Daily 02:00 | Per-user completed local month, idempotent per user/month/channel | `MANUAL_ONLY` |
| `/api/cron/cleanup-exchange-rates` | Sunday 03:00 | Delete rates older than 30 days | `MISSING` — rates accumulate forever |

The weekly and monthly report *content* already exists in Luyra
(`lib/services/finance-report-service.ts`), and both Telegram
(`/api/finance/telegram/send`) and email (`/api/finance/email/send`) delivery
work today. Only the scheduler and its `CRON_SECRET` gate are missing — this
is the highest value-per-effort item in the whole list, because it activates
five features whose logic is already written.

Budget-threshold alerts and spending-spike detection have no Luyra
counterpart at all, scheduled or manual.

## 2. Schema ported, feature never built

These are already in `db/migrations/004_finance.sql`, but no application code
touches them. Verified with a repo-wide grep across `lib/`, `app/`, and
`components/`.

| Item | Status | Money Flow equivalent | Notes |
|---|---|---|---|
| `finance_recurring_transactions` | `SCHEMA_ONLY` | `/api/recurring` (GET/POST/PUT/DELETE), `components/transactions/RecurringSheet.tsx`, `/api/cron/recurring` | Deferred by request in the parity doc; it is the only phase left from the original 1–16 list. The savings auto-plan below depends on the same machinery. |
| `finance_transaction_description_aliases` | `SCHEMA_ONLY` | `components/budget/MerchantNamesSheet.tsx`, `lib/finance/analysis/aliases.ts` | Luyra subscription detection still groups by exact normalized description, so `NETFLIX` and `NETFLIX.COM` stay separate. |
| `finance_ai_insights` | `SCHEMA_ONLY` | `lib/finance/insights/{generate,rules,ai}.ts`, `20260727_ai_money_coach.sql` | Money Coach output is not persisted, so there is no Review / Apply / Snooze / Dismiss history and no rules-based (non-AI) insight tier. |
| Savings `auto_monthly_usd`, `last_auto_month`, `reminder_day`, `skipped_month`, `last_reminder_month` | `SCHEMA_ONLY` | `savings/_components/SavingsCoach.tsx`, `20260320_savings_auto_deposit.sql`, `20260718164519_savings_confirmation_reminders.sql` | Contributions are manual-only. No planned amount, no reminder day, no month skip, no progress celebration. |

## 3. No schema and no code

| Feature | Money Flow source | Notes |
|---|---|---|
| AI chat over your own data | `/api/chat`, `lib/finance/chat-tools.ts`, `components/ai/{ChatBot,ChatLauncher,DeferredChatBot}.tsx` | Luyra's AI is one-shot monthly-report commentary only. Money Flow exposes tool-calling against the user's finance data. |
| AI quick entry | `/api/ai/parse-transaction`, `/api/ai/suggest-category`, `lib/ai/transaction-parser.ts` | Natural language to a draft transaction. Note AGENTS.md's rule: free text must never write financial data without a deterministic, confirmed path. |
| Category spending class | `20260727_category_spending_class.sql`, `components/budget/CategoryTypesSheet.tsx`, `lib/finance/spending-class.ts` | Fixed / variable / discretionary classification that feeds budget advice. No column in Luyra. |
| Category and payment-method management | `settings/_components/{CategoriesSection,PaymentMethodsSection}.tsx` | Luyra's `app/api/finance/categories/route.ts` and `app/api/finance/payment-methods/route.ts` export **GET only**. Users cannot create, rename, recolor, reorder, or delete either one. |
| Review to next-month plan | `POST /api/finance/budget-plan`, `/api/finance/goal-plans`, `review/page.tsx` | Luyra's `/api/finance/review` is GET only, and `components/finance/review/review-view.tsx` has no action buttons — the review is read-only, with no way to confirm and apply next month's budget. |
| Appearance / theme setting | `settings/_components/AppearanceSection.tsx` | Luyra has theme tokens in `app/globals.css` but no user-facing toggle anywhere. |
| Push notifications | `20260410_push_subscriptions.sql` | Absent. |
| Avatar upload | `20260525_avatars_storage.sql`, `components/ui/Avatar.tsx` | Luyra's `components/ui/UserAvatar.tsx` is display-only. |
| App version endpoint | `/api/version`, shown in Settings | Absent. |
| AI provider selection | `/api/settings/ai-provider`, `settings/ai/page.tsx`, `20260606_ai_provider.sql` | Money Flow lets the user pick Gemini or OpenAI, with the other as fallback. Luyra is Anthropic-only via `lib/ai/client.ts`. Low priority — single-provider is a defensible choice, not a defect. |

## 4. Transaction screen UX gaps

Luyra already has debounced search, a filter panel, and templates
(`components/finance/transactions/`). Still missing:

- **Bulk actions** — no multi-select and no equivalent of
  `transactions/_components/BulkActionBar.tsx` (bulk delete, bulk
  recategorize).
- **Swipe row actions** — `components/transactions/SwipeableRow.tsx`. Luyra is
  tap-to-edit plus a dropdown menu. Deliberately deferred in the parity doc
  (needs on-device testing, and there is no harness in this repo).
- **Search history** — `transactions/_hooks/useSearchHistory.ts`.
- **Description suggestions** — `hooks/useDescriptionSuggestions.ts` plus
  `AddTransactionSheet/DescriptionSuggestions.tsx`, autocompleting from past
  entries.
- **Shared mobile UI primitives** — Money Flow has `NumericKeypad`,
  `usePullToRefresh`, `useKeyboardShortcuts`, `OfflineBanner`,
  `AnimatedNumber`, `FAB`, and `Skeleton`. Luyra has none of these.

## 5. Engineering hygiene

- **No tests at all.** Luyra's `package.json` scripts are only
  `dev/build/start/lint` — no test runner, no `e2e/`. Money Flow runs Vitest
  across the whole `lib/finance/analysis` engine (roughly fifteen suites,
  including migration regression tests) plus Playwright desktop and mobile
  journeys. Luyra's `lib/services/finance-*.ts` layer is the natural first
  target.
- **No route-level boundaries.** Luyra has zero `loading.tsx`, `error.tsx`,
  `not-found.tsx`, or `global-error.tsx`. Money Flow ships one per route.
  Today an API failure inside a Finance route has no boundary to catch it.
- **No client-side query caching.** Money Flow moved categories, budgets,
  analytics, and monthly spending onto TanStack Query.
  `components/finance/transactions/transaction-list.tsx` builds a manual
  `requestKey` string and refetches on every navigation.
- **Unapplied migration.**
  `db/migrations/007_finance_savings_contributions_cascade.sql` exists but,
  per `db/README.md` and the parity doc, has not been applied. Until it is,
  deleting a savings goal that has any contribution history fails with a
  foreign-key violation.

## Suggested order

1. **Cron infrastructure + `vercel.json`.** Unblocks five features whose logic
   is already written. Needs `CRON_SECRET` and a `requireCronAuthorization`
   helper mirroring Money Flow's `lib/server/cron.ts`.
2. **Recurring transactions.** The table is already there, and the savings
   auto-plan reuses the same due-date machinery.
3. **Category and payment-method CRUD.** A plain functional gap users hit on
   day one.
4. **Route loading/error boundaries, then a Vitest setup** over
   `lib/services/finance-*.ts`.
5. **Merchant aliases, spending class, AI chat.** Larger, genuinely new
   domains — worth their own phases.

Items intentionally excluded from Luyra remain excluded: Money Flow
authentication, browser-side Supabase CRUD, and any AI path that writes
financial data without explicit confirmation.
