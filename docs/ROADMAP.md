# Roadmap

## Phase 1 — Foundation

- [x] Auth (Supabase, login/logout, protected routes)
- [x] User sync (`ensureAppUser`, Neon `users` table)
- [x] Tasks CRUD (create, list, edit, complete/reopen, delete; `/tasks` with status + priority filters)
- [x] Goals CRUD (create, list, edit, progress, pause/resume/complete, delete; `/goals` with status filter)
- [x] Today Tasks (remaining/overdue counts, quick add)
- [x] Today Goals (active goals with progress, quick add)

## Phase 2

- [x] Finance integration foundation (isolated Money Flow Supabase session)
- [x] Read-only Finance dashboard test slice
- [ ] Money Flow transactions, budgets, savings, analytics, and settings
- Habits
- Reminders

## Phase 3

- [x] Learning integration foundation (shared Hengo/HeangOS session)
- [x] Read-only Learning dashboard test slice
- [ ] Hengo vocabulary, daily study, interview, and progress routes
- Notion
- AI assistant

## Phase 4

- Spring Boot backend migration (see [ARCHITECTURE.md](./ARCHITECTURE.md))
