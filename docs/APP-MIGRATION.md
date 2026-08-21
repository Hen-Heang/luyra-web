# Money Flow and Hengo migration

Luyra is the destination application. The migration uses a strangler approach:
routes move into Luyra one working slice at a time while the existing Supabase
projects continue to own their data.

## Test slice

| Luyra route | Source product | Data source | Session model | Current access |
| --- | --- | --- | --- | --- |
| `/finance` | Money Flow | Money Flow Supabase | Separate browser session | Read-only monthly summary and recent transactions |
| `/learning` | Hengo | Hengo Supabase | Shared Luyra session | Read-only profile, vocabulary, reviews, activity, and latest plan |

No rows are copied to Neon or between Supabase projects in this phase. Existing
row-level security remains authoritative.

## Authentication model

Hengo is the primary Luyra identity. Google login uses Hengo's existing Google
Identity Services ID-token flow, so it does not require an application OAuth
callback route. Email and password remain available for Hengo email identities.

Money Flow and Hengo are different Supabase Auth projects with different Google
OAuth client IDs. A token issued by one project cannot authorize rows protected
by the other project's RLS. Matching accounts by email would not prove that the
same person controls both accounts.

Luyra therefore stores the Money Flow session under the isolated
`luyra-money-flow-auth` browser key. Google users link Money Flow with one OAuth
click and normally reuse the Google account already active in the browser. The
email/password form remains as a fallback for Money Flow email identities. Only
public project URLs, publishable keys, and Google client IDs are exposed to the
browser.

## Environment

The primary `NEXT_PUBLIC_SUPABASE_*` variables continue to point to the Hengo
project used by Luyra Auth. Finance additionally needs:

```text
NEXT_PUBLIC_MONEY_FLOW_SUPABASE_URL=
NEXT_PUBLIC_MONEY_FLOW_SUPABASE_PUBLISHABLE_KEY=
```

The primary Hengo Google Identity Services flow also needs:

```text
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
```

Keep service-role keys server-side and out of this application.

## Migration sequence

1. Validate the two read-only dashboard slices and account/session behavior.
2. Port Money Flow transactions, budgets, savings, analytics, and settings as
   native Luyra routes, preserving Money Flow RLS and tables.
3. Port Hengo vocabulary, daily study, interview, progress, and supporting
   learning routes, reusing the primary Hengo/Luyra session.
4. Move shared UI and domain code into Luyra modules; do not import the old
   applications as nested repositories.
5. Add write operations only after each route's read path, authorization, and
   error states are verified.
6. Retire the old frontends only after feature parity and production acceptance.

The separate Neon database remains the store for native Luyra tasks, goals,
and future Luyra-owned domains. A later data consolidation is a separate
migration and requires an identity mapping and rollback plan.
