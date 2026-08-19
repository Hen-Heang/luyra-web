# HeangOS

Personal life and productivity operating system.

Phase 1 covers: authentication, a Today dashboard, and task management, on
top of Supabase (auth) and Neon (application data). See
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for how the pieces fit together
and [docs/ROADMAP.md](docs/ROADMAP.md) for what's done vs. planned.

## Tech stack

- Next.js (App Router) + React + TypeScript
- Tailwind CSS, shadcn/ui-style components
- Supabase Auth (`@supabase/ssr`, `@supabase/supabase-js`) — authentication only
- Neon Postgres (`@neondatabase/serverless`) — application data
- Zod for request validation

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Corporate network / TLS inspection

If `next dev` (or any Neon/Supabase CLI) fails with `SELF_SIGNED_CERT_IN_CHAIN`
or "self-signed certificate in certificate chain", your network is doing TLS
inspection (observed here: Somansa DLP) and Node doesn't trust its root CA —
even though your OS and browser already do. Fix it for Node specifically:

1. Export the intercepting root CA to a PEM file (ask IT, or export it from
   Windows' trusted root store / your browser's certificate settings).
2. Set `NODE_EXTRA_CA_CERTS=/path/to/that.pem` before running `npm run dev`,
   `next build`, or any Neon/Supabase CLI — Node ignores the OS trust store,
   so this has to be explicit. Keep the PEM out of git; it's machine/network
   specific.

## Environment variables

Copy `.env.example` to `.env.local` and fill in real values. Never commit
`.env.local`.

| Variable | Where it's used | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | browser + server | safe to expose |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | browser + server | safe to expose |
| `DATABASE_URL` | server only | Neon connection string — never prefix with `NEXT_PUBLIC_` |

## Supabase Auth setup

1. Use your existing Supabase project.
2. Copy the project URL and publishable (anon) key from Project Settings →
   API into `.env.local`.
3. Supabase only handles authentication here — no application tables
   (tasks, goals, etc.) are created in Supabase.

## Neon setup

Using the `heangos-web` Neon project (id `divine-darkness-19631415`), `main`
branch, `neondb` database. The `users`/`tasks`/`goals` migrations in
[db/migrations](db/migrations) are already applied there — see
[db/README.md](db/README.md) if you need to re-apply or add a new one.

To point a fresh checkout at it:

1. Get the pooled connection string: `neon connection-string --project-id divine-darkness-19631415 --pooled`
   (or from the Neon console → Connect).
2. Put it in `.env.local` as `DATABASE_URL`.

## Future: Spring Boot backend

Phase 4 replaces the Next.js Route Handlers under `app/api/*` with a Spring
Boot REST API in front of the same Neon database. `lib/api/*.ts` is the only
layer components talk to, so that swap changes a base URL and a handful of
server files — not the frontend. Details in
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
