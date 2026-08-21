# Database migrations

Plain SQL files, applied manually and in order. Nothing here runs
automatically — there is no migration runner wired into the app or CI.

## Applying a migration

Using `psql` against your Neon connection string:

```bash
psql "$DATABASE_URL" -f db/migrations/001_users.sql
psql "$DATABASE_URL" -f db/migrations/002_tasks.sql
psql "$DATABASE_URL" -f db/migrations/003_goals.sql
psql "$DATABASE_URL" -f db/migrations/004_finance.sql
psql "$DATABASE_URL" -f db/migrations/005_learning.sql
psql "$DATABASE_URL" -f db/migrations/006_habits.sql
psql "$DATABASE_URL" -f db/migrations/007_finance_savings_contributions_cascade.sql
psql "$DATABASE_URL" -f db/migrations/008_telegram_accounts.sql
psql "$DATABASE_URL" -f db/migrations/009_finance_report_email.sql
```

Or paste the file contents into the Neon SQL Editor in the Neon console.

Every `create table` uses `if not exists`, so re-running a migration you've
already applied is a no-op rather than an error.

## Adding a new migration

Add a new numbered file (`004_*.sql`, `005_*.sql`, ...) — never edit a
migration that has already been applied to a real database. Keep each file
additive; don't add `drop table` or destructive statements without applying
them yourself deliberately.
