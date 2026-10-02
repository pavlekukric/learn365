# Phase 23 — Signed-in sync: no silent loss

**Source:** `docs/PRODUCT_REVIEW_2026-10-01.md`, P1 item 4.
**Status:** owner-approved 2026-10-02 (implicit sign-out keeps the queue); shipped. See "Changed during implementation" at the end.

## The loss paths today (verified in code, `main` at c02de1a)

The sync engine (`lib/sync/syncEngine.ts`) keeps unsent changes **only in memory**. It also starts only after `/api/me` answers. On every later load its first step is `GET`, and the answer **replaces** the local store.

| # | What the reader does | What happens |
|---|---|---|
| 1 | Marks a lesson read and reloads or closes the tab within ~250 ms (the debounce), or clicks before `/api/me` has answered | The change is in `localStorage`, but no delta was recorded. The next load's `GET` overwrites it. **Lost.** |
| 2 | Marks lessons read during a database outage (PATCH 503 twice), then closes the tab | The queue was in memory. The next load's `GET` overwrites the local copy. **Lost.** |
| 3 | Same, offline (train, tunnel) | Same. **Lost.** |
| 4 | The session expires while changes are queued | An implicit sign-out clears the stores. **Lost** for the account. |
| 5 | Two tabs open; reads in tab A, then in tab B | Each tab writes its whole in-memory store to `localStorage`, so tab B's write drops tab A's lesson locally. The server gets both deltas; the local copy is wrong until the next load. |
| 6 | Two tabs; `Odjava` in tab A, any change in tab B | Tab B still holds user 1's progress in memory and writes it back to `localStorage`, now **without** a marker. The next person to sign in in this browser has no marker, so their first sync **unions user 1's progress into their account**. This is the cross-account merge the 2026-09-30 review called fixed. |

## Decisions

### 1. A persistent, per-user pending queue (paths 1–4)

- **New `lib/sync/pendingQueue.ts`:** one `localStorage` key per store and account, `learn365:cloud:pending:v1:<kind>:<userId>` → `{ [courseId]: delta }`. Sets become arrays in JSON. It is always read-modify-write straight from storage and never cached, so two tabs cannot overwrite each other's entries.
- **Recorded from store load, not from the sync engine:** a journal subscribes to the store in the provider (`ProgressStoreProvider` / `BookmarkStoreProvider`), at creation, before any page effect runs.
  - It records each change into the queue of the account the **marker** names.
  - With no marker (a reader who never signed in on this browser) it records nothing. The first sign-in's union (`POST …/sync`) already carries the whole local copy.
- **The engine drains the queue instead of an in-memory map:**
  - On start, it reads this user's queue and applies it on top of the `GET` answer (the existing `applyRemote(…, pending)` path).
  - On each change, it debounces, `PATCH`es every queued course, and on success **acks**: it subtracts exactly what was sent, so a change made while the request was in flight stays queued.
  - The deltas are idempotent sets (`complete` / `uncomplete`, `add` / `remove`), so sending one twice (two tabs, a crash after the request) is harmless.
- **Retry:** unchanged (one retry after 2 s, then the next change or the `online` event). Added: a flush on `visibilitychange → visible` and on start, so a queue left by a closed tab goes out on the next visit.
- **Queues of other accounts are never replayed.** The engine only reads `…:<its userId>`. On a sign-in, any other account's queue is deleted, so user 1's changes can never land in user 2's account.

### 2. Two tabs (path 5)

- Each store provider listens for `storage` events on its own persist key (`learn365:progress:v1`, `learn365:bookmarks:v1`). On a change it rehydrates from `localStorage` (`store.persist.rehydrate()`).
- If the key was removed, it resets the in-memory store.
- The journal and engine ignore changes caused by a rehydrate (an `applying` flag, the same pattern the engine already uses for `applyRemote`). The other tab already queued them.

### 3. Sign-out in one tab reaches the others (path 6)

- **When the marker key is removed** (`Odjava`, `Obriši nalog` or an implicit sign-out in another tab), every other tab:
  1. resets its in-memory stores without journaling;
  2. disposes its sync engine;
  3. re-asks `/api/me`. With the shared cookie gone, the answer is "signed out", and the header updates.
- **Belt and braces:** before writing the store, the journal checks that the marker it captured still matches storage. A tab whose marker vanished can no longer queue anything for the previous account.

### 4. Sign-out and the queue (owner's call — recommendation below)

- **`Odjava` / `Obriši nalog`:** first a best-effort flush of the queue (at most 2 s, so the button never hangs), then everything is cleared as today, the queue included. Changes still unsent after 2 s are dropped. This is the reader's own explicit action, and `/privatnost` promises a cleared browser.
- **Implicit sign-out (the session expired):** the stores are cleared as today, but **the queue is kept**. It is tagged with that account's id, is only ever replayed into the same account at the next sign-in, and holds only lesson ids. **Recommended.** The alternative is to clear it as well: simpler, but path 4 stays lossy.

## Files

- `apps/web/lib/sync/pendingQueue.ts` (+ test) — new; storage, merge, ack (subtract).
- `apps/web/lib/sync/journal.ts` (+ test) — new; store subscription → queue, marker check, rehydrate guard.
- `apps/web/lib/sync/syncEngine.ts` (+ tests) — drains the queue; ack on success; flush on start / `visible` / `online`.
- `apps/web/lib/sync/progressAdapter.ts`, `bookmarkAdapter.ts` — `subtractDelta`, `toJSON` / `fromJSON` for deltas.
- `apps/web/lib/progress/ProgressStoreProvider.tsx`, `lib/bookmarks/BookmarkStoreProvider.tsx` — journal at creation; `storage` listener.
- `apps/web/lib/auth/AuthProvider.tsx` — cross-tab sign-out; best-effort flush before `Odjava`; queue keys in the explicit clear.
- `apps/web/lib/auth/localKeys.ts` — queue key prefix.
- `apps/web/lib/sync/CloudSync.tsx` — expose the flush for sign-out.
- Docs: PROJECT_STATE (Phase 23 + baseline "Accounts + sync"), HANDOFF.

No server, schema or API change.

## Gates

- **Unit (Vitest):** the queue (merge, ack keeps newer changes, other users' queues ignored), the journal (no marker → nothing; a vanished marker → nothing; rehydrate → nothing), and the engine (a queue from a "closed tab" is applied over `GET` and flushed; a 503 twice → still queued after dispose; a replay is idempotent).
- **E2E (`accounts-chromium`, seeded PGlite), new cases:**
  1. Mark read, reload at once → still read and on the server.
  2. Route `PATCH` to 503, mark read, close the page, open a new one with the route healthy → read and on the server.
  3. Two pages in one context: read in A, then in B → both read in both after a moment, and on the server.
  4. Two pages: `Odjava` in A, mark read in B → B shows signed out with an empty store; sign in as a second seeded user → their account has none of user 1's lessons.
- Plus lint, typecheck, build, `check-bundle` and the full CI.

## Out of scope

Server-side changes, conflict resolution beyond set semantics, a visible "unsynced" indicator (possible later: a quiet dot on the progress pill while the queue is non-empty).

## Changed during implementation

- **One queue key per tab, not one per account.** `localStorage` is not transactional across tabs: each renderer keeps its own cached copy. A shared key's read-modify-write in two tabs dropped a change about 1 run in 5 of the two-tab e2e. The key is now `learn365:cloud:pending:v1:<kind>:<userId>:<tabId>`, written only by its own tab.
  - Each tab holds a Web Lock named after its id (`lib/sync/tabLock.ts`) for its lifetime.
  - An engine adopts the queues of tabs whose lock is gone (closed, reloaded) and sends them.
  - It applies every tab's queue over a loaded snapshot, but sends only its own.
  - Without Web Locks (very old browsers) an engine adopts other queues only at start.
- **The engine no longer re-schedules right after a failed send** (a hot loop the unit test caught). After a failure, only the retry timer, the next change, `online` or the tab becoming visible tries again.
- **The marker check in the journal** (decision 3, "belt and braces") is covered differently: the engine tags changes with its own user while it runs, and after it is disposed only the marker counts, which a sign-out removes.
- **Test fix:** the existing union e2e waited for nothing after `goto('/')`. A late `/api/me` from that page, answered after the session cookie was set, could start a sync from the page's empty store. It now waits for that answer.
