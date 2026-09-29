# Phase 16 — Pregled naloga: the owner's read-only accounts overview (PLAN)

**Status:** Done — merged (PR #57, squash `02d226c`), live 2026-09-29 15:46 UTC — requested by the owner on 2026-09-29 ("hoću stranicu"), after asking how to see who has registered. Outcome: `docs/PROJECT_STATE.md` → "Phase 16".
**Date:** 2026-09-29
**Predecessors:** Phase 15 live (PR #53); visit statistics live (PR #55).
**Parent references:** `HANDOFF.md`; `docs/BACKEND_STRATEGY.md`; `docs/DEPLOY.md` §10.

## Why

Cloudflare's statistics count visits; they cannot say who has an account. Today the only way to see the accounts is a SQL command on the box. The owner asked for a page.

`CLAUDE.md` lists "admin panel" and "CMS" under *do not implement unless explicitly requested*. This is the explicit request, and the scope below is what was offered and accepted: **a small private page, visible only to the owner's account, with the number of registered accounts and the table the SQL command prints.** Nothing else in that list changes: no CMS, no editing of accounts, no roles UI.

## 1. Locked decisions

### D1 — Read-only, one page, no API

- Route `/pregled` (the `(account)` group, next to `/prijava` and `/nalog`). A server component reads the database and renders; there is **no `/api/**` route** behind it, so there is no endpoint to guard, script or leak.
- No actions: no delete, no edit, no export, no search. Accounts are deleted by their owners on `/nalog`.

### D2 — Who may see it: a flag on the account, set by hand

- `users.is_admin boolean not null default false` (additive migration `0001`). After the merge nobody has it, so the page is a 404 for everyone — a dark deploy, as Phase 8 was.
- The owner turns it on for their own account with **one SQL command on the box** (`docs/DEPLOY.md` §15), after signing in once. There is no UI that grants it and no code path that writes it: `upsertGoogleUser` sets profile fields only.
- Why not an e-mail allow-list in the environment: it needs a new variable in `.env` *and* a new `docker-compose.yml` on the box *and* a restart — three manual steps against one — and a typo fails silently. Why not the address in the code: a personal address does not belong in the repository.
- The flag is on the row keyed by Google's `sub`: deleting the account deletes the privilege with it.

### D3 — Access

| Visitor | Answer |
| --- | --- |
| accounts off (CI, local without `.env.local`) | 404 |
| signed out | redirect to `/prijava?nazad=/pregled` |
| signed in, `is_admin = false` | 404 — the same page a wrong address gets |
| signed in, `is_admin = true` | the overview |

The decision is one pure function (`resolveOverviewAccess`) with unit tests; the page does nothing before it has answered. `force-dynamic`, `noindex`, and `/pregled` joins the `Disallow` list in `robots.txt`.

### D4 — What it shows

- **Summary:** accounts in total · new in the last 7 days · active in the last 7 days.
- **Per account**, newest first: name, e-mail, registered, last activity, lessons read (`N / 365`), lessons saved.
- *Last activity* = the later of the last sign-in (`users.last_seen_at`) and the last change of progress (`course_progress.updated_at`) — a session lasts 30 days, so the last sign-in alone would understate it.
- The list is capped at the 500 newest accounts; the total above it is always the real count.
- Not shown: Google's `sub`, the profile picture, session data.

### D5 — Look

The register of the account pages and the course overview: eyebrow, serif title, one summary line, a table drawn with hairlines and mono column heads. On a phone each account is a two-line row. No charts, no cards with big numbers, no colour beyond the palette — it is a list for one reader, not a dashboard.

### D6 — Privacy page

`/privatnost` → `Sa Google nalogom` gains one sentence: `Spisak naloga vidi samo osoba koja vodi sajt.`

### D7 — Entry point

`/nalog` shows a quiet `Pregled naloga` link to accounts with the flag, and to nobody else. The flag is read on the server from the session's own row; `/api/me` and `PublicUser` do not change.

### D8 — One PR, three commits

- **16a — Data + access:** schema + migration, `getAccountsOverview`, `resolveOverviewAccess`, unit tests (PGlite).
- **16b — Page:** `/pregled`, the link on `/nalog`, robots, the privacy sentence, e2e (accounts off → 404).
- **16c — Docs:** PROJECT_STATE, HANDOFF, DEPLOY §15, BACKEND_STRATEGY.

## 2. Gates

`pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm --filter @learn365/web check-bundle`; Playwright Chromium desktop + mobile; the page walked locally with accounts on (PGlite, a seeded admin session and seeded accounts) at 390 and 1280, as an admin, as a plain account and signed out; after the rollout `/api/health` ok and `/pregled` answers 307 → `/prijava` for a signed-out request.

## 3. Owner action (turns the page on)

Sign in on the site once, then on the box:

```
docker exec -i learn365-db psql -U learn365 -d learn365 -c "update users set is_admin = true where email = '<your address>';"
```

`UPDATE 1` means it worked. Undo: the same command with `false`.

## 4. Out of scope

Editing or deleting accounts from the page, export, search, more than one page, a roles UI, charts, e-mail reports, any change to `/api/**`.
