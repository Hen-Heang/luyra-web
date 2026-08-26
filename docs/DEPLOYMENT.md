# Deployment

Target: **Vercel**, matching the Money Flow reference deployment. Nothing in
this repo is Vercel-specific yet, so another Node host works too — but the
cron section below assumes Vercel Cron.

Data lives in **Neon Postgres**; authentication lives in **Supabase Auth**.
Both are already provisioned — this guide connects a deployment to them, it
does not create them.

## 1. Connect the repository

1. Vercel → **Add New… → Project** → import this repository.
2. Framework preset: **Next.js** (auto-detected). Leave the build command,
   output directory, and install command at their defaults.
3. Node.js version: **20.x or newer** — `@neondatabase/serverless` and Next 16
   both require it.
4. Do **not** deploy yet. Add the environment variables first (next section),
   otherwise the first build ships without them.

## 2. Environment variables

Add these under **Settings → Environment Variables**. Tick every environment
you want the value in (Production / Preview / Development).

### Required — the app will not work without these

| Variable | Scope | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | browser + server | From Supabase → Project Settings → API. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | browser + server | The publishable (anon) key. Safe to expose. |
| `DATABASE_URL` | **server only** | Neon connection string. Use the **pooled** one — see below. Never prefix with `NEXT_PUBLIC_`. |

**Use Neon's pooled connection string.** Vercel functions are short-lived and
can scale to many concurrent instances; the direct (unpooled) string will
exhaust Postgres connections under any real traffic.

```bash
neon connection-string --project-id divine-darkness-19631415 --pooled
```

Or copy it from the Neon console → **Connect** → toggle *Connection pooling*
on. The pooled host contains `-pooler` in its name.

### Optional — each one degrades gracefully when unset

| Variable | Scope | Enables | Without it |
|---|---|---|---|
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | browser | Google sign-in button | Email + password login still works; the Google button reports "Google sign-in is not configured." |
| `EXCHANGE_RATE_API_KEY` | server | Live USD→KRW rate | Falls back to a fixed rate the user can still edit per transaction. |
| `TELEGRAM_BOT_TOKEN` | server, secret | Sending Telegram messages | Settings shows "Telegram integration isn't configured." |
| `TELEGRAM_WEBHOOK_SECRET` | server, secret | Validating inbound webhook calls | Same as above. A value you choose yourself. |
| `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` | browser | The `t.me` deep link in Settings | Linking UI can't build its deep link. |
| `ANTHROPIC_API_KEY` | server, secret | AI Money Coach | Settings shows "AI Money Coach isn't configured." |
| `ANTHROPIC_MODEL` | server | Model override | Defaults to `claude-opus-5`. |
| `RESEND_API_KEY` | server, secret | Emailing the weekly/monthly report | Settings shows "Email isn't configured." |
| `RESEND_FROM_EMAIL` | server | Custom sender address | Sends from Resend's shared sandbox address, which is more likely to be filtered. |

### Do not set these

`NEXT_PUBLIC_MONEY_FLOW_SUPABASE_URL` and
`NEXT_PUBLIC_MONEY_FLOW_SUPABASE_PUBLISHABLE_KEY` are listed in
`.env.example` but are **dead**. The only files that read them —
`components/finance/money-flow-dashboard.tsx` and
`money-flow-session.tsx` — are not imported by any route. Finance now runs
entirely on the native Neon API. Setting them does nothing; they are a
cleanup candidate, not a deployment step.

## 3. Supabase Auth URLs

Supabase → **Authentication → URL Configuration**:

- **Site URL**: `https://<your-production-domain>`
- **Redirect URLs**: add every origin that will complete a sign-in.

```text
https://<your-production-domain>/auth/callback
https://<your-vercel-project>-*.vercel.app/auth/callback
http://localhost:3000/auth/callback
```

The wildcard entry covers preview deployments, whose subdomain changes per
branch. Both Google OAuth and the password-reset flow land on
`/auth/callback` (`components/auth/forgot-password-form.tsx:24` sends
`?next=/reset-password`), so this single path covers both.

## 4. Google Identity Services

Only if you set `NEXT_PUBLIC_GOOGLE_CLIENT_ID`. In Google Cloud Console →
**APIs & Services → Credentials** → your OAuth client:

- **Authorized JavaScript origins**: your production domain, plus
  `http://localhost:3000`.

`components/auth/hengo-google-sign-in.tsx` uses the Google Identity Services
script (`accounts.google.com/gsi/client`) with a nonce, so it needs the
*origin* authorized — not a redirect URI.

## 5. Telegram webhook — after the first successful deploy

Nothing in this codebase calls `setWebhook`. Register it yourself once the app
has a public HTTPS URL:

```bash
curl "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook" \
  -d "url=https://<your-production-domain>/api/telegram/webhook" \
  -d "secret_token=<TELEGRAM_WEBHOOK_SECRET>"
```

`app/api/telegram/webhook/route.ts` rejects any request whose
`X-Telegram-Bot-Api-Secret-Token` header doesn't match, so the
`secret_token` value must be identical to the deployed env var.

Verify with `https://api.telegram.org/bot<TOKEN>/getWebhookInfo` — a non-empty
`last_error_message` means the URL isn't reachable or the secret disagrees.

## 6. Resend sender domain

Only if you set `RESEND_API_KEY`. To use your own `RESEND_FROM_EMAIL`, verify
the domain in the Resend dashboard first (DNS records). Until then, leave
`RESEND_FROM_EMAIL` unset and mail sends from Resend's sandbox address.

## 7. Database migrations

There is no migration runner — see [db/README.md](../db/README.md). Apply any
pending files to the Neon database **before** the deploy that depends on them,
either with `psql` or by pasting into the Neon SQL Editor.

> **Pending right now:**
> `db/migrations/007_finance_savings_contributions_cascade.sql` has never been
> applied. Until it is, deleting a savings goal that has contribution history
> fails with a foreign-key violation.

## 8. Post-deploy verification

- [ ] Sign in with email + password.
- [ ] Sign in with Google (if configured).
- [ ] Request a password reset and confirm the emailed link lands on
      `/reset-password` rather than an "invalid redirect" error.
- [ ] `/finance` loads with real data — this proves `DATABASE_URL` reached the
      function.
- [ ] Add, edit, and delete a transaction.
- [ ] Delete a savings goal that has contributions (proves migration 007
      landed).
- [ ] Settings → link Telegram, then **Send to Telegram** on a report.
- [ ] Settings → **Send email** on a report.
- [ ] Install the PWA and load it once offline.

## Not wired up yet

### Cron

Luyra has no `app/api/cron/**` routes and no `vercel.json`. Vercel needs
neither to build a Next.js app, so a `vercel.json` is only worth adding once
the routes exist. When they do, this is the schedule to mirror from Money
Flow (all times UTC):

```json
{
  "crons": [
    { "path": "/api/cron/recurring", "schedule": "0 0 * * *" },
    { "path": "/api/cron/savings", "schedule": "30 0 * * *" },
    { "path": "/api/cron/cleanup-exchange-rates", "schedule": "0 3 * * 0" },
    { "path": "/api/cron/budget-alerts", "schedule": "0 10 * * *" },
    { "path": "/api/cron/daily-reminder", "schedule": "0 3 * * *" },
    { "path": "/api/cron/daily-reminder", "schedule": "0 12 * * *" },
    { "path": "/api/cron/spending-spike", "schedule": "0 12 * * *" },
    { "path": "/api/cron/weekly-summary", "schedule": "0 0 * * 1" },
    { "path": "/api/cron/monthly-report", "schedule": "0 2 * * *" }
  ]
}
```

Each route must require `Authorization: Bearer <CRON_SECRET>`, which means a
new server-only `CRON_SECRET` env var. See
[FINANCE-GAP-ANALYSIS.md](./FINANCE-GAP-ANALYSIS.md) §1 for what each job
does and which already have their logic written.

Note that Vercel's Hobby plan limits cron jobs to a small number of daily
invocations; the schedule above assumes a paid plan.

### Security headers

`next.config.ts` is empty. Money Flow sets `X-Content-Type-Options`,
`X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, and a
`Content-Security-Policy` via `headers()`. Luyra sets none of them, so a
public deployment ships without CSP or clickjacking protection.

Porting this needs care rather than a copy-paste: Luyra's allowed origins
differ from Money Flow's (`accounts.google.com` for the sign-in script,
`api.anthropic.com` instead of Gemini/OpenAI, plus Supabase, Resend, and
exchangerate-api). A CSP that's too strict silently breaks Google sign-in, so
it should land as its own change and be verified against a preview
deployment.

### Region

Vercel functions default to `iad1` (US East). If the Neon project is in
Asia-Pacific, every query crosses the Pacific twice. Check the region in the
Neon connection host (e.g. `ap-southeast-1.aws.neon.tech`) and, if it isn't
US East, pin the function region to match in `vercel.json`:

```json
{ "regions": ["icn1"] }
```
