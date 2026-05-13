# Backend Strategy

The planning document for the Learn365 backend. **Planned, not built in v1.** v1 frontend is local-only (progress in `localStorage`); the backend is a v2 concern that begins after the web v1 is visually approved.

This document exists so that v1 architectural choices stay compatible with the future backend, and so the backend phase starts from a clear shape rather than a green field.

---

## 1. Role

The backend exists primarily to enable **cloud progress sync** — letting a user read on their laptop, continue on their phone, and not lose progress if they clear their browser data. Secondary responsibilities:

- **User accounts** (authentication so progress can belong to *someone*).
- **Optional future content delivery** — only if we decide to move lessons out of the client bundle. Not in initial scope.
- **Optional future CMS** — backend-managed lesson authoring, if/when the content team outgrows TypeScript modules and MDX.

Not in scope, even long-term unless explicitly added:

- Payments / subscriptions.
- Social features.
- Analytics ingestion (use a third-party SDK if/when we add analytics).

---

## 2. Tech stack

| Layer | Choice |
|---|---|
| Framework | **ASP.NET Core on .NET 9** — Web API |
| Language | **C# 13** |
| ORM | **Entity Framework Core 9** (code-first migrations) |
| Database | **SQL Server 2022** (Azure SQL in production, LocalDB or Docker image for dev) |
| Auth | **ASP.NET Core Identity** + JWT (short-lived access tokens + HttpOnly refresh cookie) |
| Testing | **xUnit** for unit, **WebApplicationFactory** for integration |
| Logging | **Serilog** with structured logs |
| API style | **REST + JSON**, OpenAPI document published at `/openapi/v1.json` |
| Hosting (target) | **Azure App Service** (Linux) + **Azure SQL** |
| Local dev | **Docker Compose** with `mcr.microsoft.com/mssql/server:2022-latest` |

---

## 3. Repository placement

Backend lives **in the same Learn365 repository** under a new app:

```
learn365/
├─ apps/
│  ├─ web/                       # existing
│  ├─ mobile/                    # later
│  └─ api/                       # NEW — .NET 9 Web API
└─ packages/                     # unchanged
```

Justifications:

- One repo, one CI, one PR review surface — keeps the platform unified.
- `apps/api` can consume the shape of `@learn365/content` types via a build-time DTO generation step (TS → C# class generator) so wire formats can't drift.
- Mobile and web both consume the same API; co-locating reduces friction.

### .NET solution layout *(created in the backend build phase, not now)*

```
apps/api/
├─ Learn365.Api/                 # ASP.NET Core Web API entry project
│  ├─ Program.cs
│  ├─ Endpoints/                 # minimal-API style route grouping
│  │  ├─ AuthEndpoints.cs
│  │  └─ ProgressEndpoints.cs
│  ├─ Dtos/
│  ├─ Services/
│  └─ appsettings.json
├─ Learn365.Data/                # EF Core: DbContext, entities, migrations
│  ├─ Learn365DbContext.cs
│  ├─ Entities/
│  └─ Migrations/
├─ Learn365.Domain/              # Domain types mirroring Course/Era/Section/Lesson/UserProgress
├─ Learn365.Tests/               # xUnit + integration
└─ Learn365.Api.sln
```

---

## 4. API surface

REST + JSON. All endpoints under `/api`. Wire format mirrors `docs/CONTENT_MODEL.md` field-for-field.

### v2.0 — initial backend (progress + auth)

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/auth/register` | Email + password account creation |
| `POST` | `/api/auth/login` | Issues short-lived access token + sets HttpOnly refresh cookie |
| `POST` | `/api/auth/refresh` | Rotates tokens using the refresh cookie |
| `POST` | `/api/auth/logout` | Revokes the refresh token |
| `GET`  | `/api/me` | Current user profile |
| `GET`  | `/api/me/progress?courseId=…` | Returns `{ completedLessonIds: string[], lastOpenedLessonId: string \| null, updatedAt: string }` |
| `PUT`  | `/api/me/progress/lessons/{lessonId}` | Idempotent body `{ completed: bool }`. Sets state, returns updated progress shape. |
| `POST` | `/api/me/progress/sync` | Bulk reconciliation. Body is the full local progress shape; server merges with last-write-wins on `updatedAt` and union on `completedLessonIds`. Returns the canonical post-merge state. |
| `DELETE` | `/api/me/progress?courseId=…` | Resets the user's progress for a course |

### v2.1+ — deferred

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/courses/{id}` | Course metadata, only if we move content server-side |
| `GET` | `/api/courses/{id}/lessons/{lessonId}` | Single lesson body |
| `POST` | `/api/admin/lessons` | CMS endpoints, gated by admin role |

Until v2.1, content stays bundled with the client and the API is **progress-only**.

---

## 5. Authentication

ASP.NET Core Identity for user storage, with a custom token issuance layer:

- **Access token**: JWT, ≤ 15-minute lifetime, sent as `Authorization: Bearer …`.
- **Refresh token**: opaque token stored server-side (table-backed, revocable), delivered as an HttpOnly + Secure + SameSite=Strict cookie scoped to `/api/auth/refresh`.
- **Rotation**: every refresh rotates the refresh token (one-time-use).
- **Password policy**: minimum 10 chars, complexity flexible (no maximum), bcrypt or ASP.NET Identity's built-in hashing.
- **Email verification**: deferred to a later sub-phase; the v2.0 release can ship with optional verification.
- **OAuth providers** (Google, Apple): deferred until after v2.0 lands.

---

## 6. Database schema sketch

Code-first via EF Core. Only progress and identity tables exist initially. Course/Era/Section/Lesson data does **not** live in SQL until/unless we move content server-side.

```
Users                            (ASP.NET Identity-generated)
├─ Id                  GUID PK
├─ Email               nvarchar(256) UNIQUE
├─ NormalizedEmail     nvarchar(256)
├─ PasswordHash
├─ CreatedAt           datetime2
├─ EmailConfirmed      bit
└─ …identity fields…

CourseProgress
├─ UserId              GUID FK → Users.Id
├─ CourseId            varchar(64)        (string ID like 'istorija-srbije-365')
├─ LastOpenedLessonId  varchar(64) NULL
├─ UpdatedAt           datetime2
└─ PK (UserId, CourseId)

LessonCompletions
├─ UserId              GUID FK → Users.Id
├─ CourseId            varchar(64)
├─ LessonId            varchar(64)
├─ CompletedAt         datetime2
└─ PK (UserId, CourseId, LessonId)

RefreshTokens
├─ Id                  GUID PK
├─ UserId              GUID FK → Users.Id
├─ TokenHash           varchar(128)
├─ ExpiresAt           datetime2
├─ RevokedAt           datetime2 NULL
├─ ReplacedByTokenId   GUID NULL
└─ CreatedAt           datetime2
```

Indexes:

- `LessonCompletions (UserId, CourseId)` — covers the "get all completions for a course" query.
- `RefreshTokens (UserId, ExpiresAt)` — for cleanup jobs.

If content ever moves into SQL, the schema mirrors the TS types in `docs/CONTENT_MODEL.md` exactly. Lesson body blocks could be stored as `nvarchar(max)` JSON or in a child table per block.

---

## 7. Client integration

The web client already has the right seam: the `ProgressStorage` interface in `@learn365/core` (planned per `docs/APP_ARCHITECTURE.md` §6). The backend lands as a new implementation of the same interface — **no UI changes, no store changes**.

### `RemoteProgressStorage` (planned)

```ts
class RemoteProgressStorage implements ProgressStorage {
  constructor(private readonly apiBaseUrl: string, private readonly auth: AuthTokenProvider) {}
  // talks to /api/me/progress, /api/me/progress/lessons/{id}, /api/me/progress/sync
}
```

### Storage selection logic (planned)

- **Anonymous user** → `LocalStorageStorage` (today's v1 default, unchanged).
- **Signed-in user** → `RemoteProgressStorage` wrapping a `LocalStorageStorage` as an offline write queue.
- **Sign-in event** → call `POST /api/me/progress/sync` once with the local payload, then switch the adapter.

The store layer above does not know which adapter is active.

---

## 8. Migration story — local-only to cloud

When a v1 (local-only) user signs in for the first time:

1. Client reads local progress from `localStorage` (key `learn365:progress:v1`).
2. Client sends it to `POST /api/me/progress/sync`.
3. Server merges:
   - `completedLessonIds`: union of local and server sets.
   - `lastOpenedLessonId`: whichever has the later `updatedAt`.
   - `updatedAt`: server's "now".
4. Server returns the canonical merged shape.
5. Client replaces local state with the server's response; the adapter is now `RemoteProgressStorage`.

Conflict policy is intentionally simple: completion is monotonic (once done, stays done), so a union is safe. `lastOpenedLessonId` uses last-write-wins because it's a UX hint, not authority.

---

## 9. CORS and hosting

- **Production API origin**: `api.istorija365.app` *(placeholder name; final domain TBD).*
- **CORS allowlist**: production web origin only; preview environments add their Vercel preview URLs via env var.
- **HTTPS** enforced. HTTP redirects to HTTPS.
- **Production deploy**: Azure App Service (Linux) + Azure SQL. Region matched to primary user base.
- **CI/CD**: GitHub Actions builds and deploys via `dotnet publish` + Azure deploy action.
- **Local dev**: Docker Compose brings up SQL Server linux image; `dotnet ef database update` applies migrations.

---

## 10. What stays the same on the client (and why)

| Layer | Change required? |
|---|---|
| `@learn365/content` (data) | None. Entity IDs are already stable strings. |
| `@learn365/core` `ProgressStore` | None. Storage adapter is the swap point. |
| `@learn365/core` selectors | None. |
| `@learn365/ui` tokens | None. |
| `@learn365/ui-web` components | None. |
| `apps/web` routes | One new sign-in route + `AuthProvider`. Existing routes unchanged. |
| `apps/mobile` *(future)* | Mirror of web: same auth flow, same `RemoteProgressStorage`. |

The single biggest reason for planning the backend now is to preserve this property — that the v1 frontend can become a v2 frontend by adding code, not by changing what's already there.

---

## 11. v1 implications — what to be careful about now

Even though no backend code is being written, v1 must avoid choices that would force a rewrite later:

- **Entity IDs are stable strings** (`nemanjici-rani-007`, etc.). No surrogate ints anywhere. Already the convention in `docs/CONTENT_MODEL.md`.
- **`updatedAt` is a hint, not authority.** The server will eventually be the source of truth; client clocks can be wrong.
- **`LessonBlock[]` must remain JSON-serializable** — no React nodes, no functions, no class instances. Already the case.
- **Don't add features to the local store** (streaks, time-spent, notes, bookmarks) without first sketching how they'd serialize to the future API. If we can't draw the API shape, we shouldn't add the feature locally yet.
- **No telemetry/analytics SDKs added speculatively** — privacy posture starts conservative and stays that way.

---

## 12. Backend phases (Phase 8 in the implementation plan)

The backend rolls out in sub-phases. Each is a separate deploy.

### 8a — API skeleton + identity
.NET 9 solution, EF Core, SQL Server connection, Identity tables, basic Program.cs, health endpoint. No business endpoints yet. Deployable.

### 8b — Auth endpoints
Register, login, refresh, logout. Token rotation, refresh cookie wiring. Manual smoke + integration tests.

### 8c — Progress endpoints
`GET/PUT/DELETE /api/me/progress…`, `POST /api/me/progress/sync`. Full coverage of v2.0 surface.

### 8d — Client adapter swap
`RemoteProgressStorage` added to `@learn365/core`; web route gains `AuthProvider`; sign-in screen added in `apps/web`. Existing UX flows otherwise unchanged.

### 8e — Production deploy + observability
Azure App Service + Azure SQL. Serilog → Application Insights or equivalent. Backups + restore drill.

Mobile work (phase 7) can run in parallel with 8a–c and adopt the adapter in 8d; mobile does not block on the backend, and the backend does not block on mobile.

---

## 13. Open risks (revisit when Phase 8 starts)

- **Identity scope creep** — adding OAuth, MFA, email verification can each become a sub-phase. Default: ship password-only + email verification, defer OAuth.
- **First-sign-in reconciliation** — the local payload might be large or stale by months. Server should accept it but cap payload size (~256 KB is generous).
- **Refresh token revocation at scale** — table grows; a daily cleanup job removes expired/revoked rows.
- **Backup and restore** — point-in-time restore on Azure SQL is the baseline; rehearse a restore before declaring Phase 8e done.
- **GDPR posture** — account deletion endpoint required if we ship to EU. Cheap to add now if planned.

---

## 14. What this document is not

- Not a final API contract — endpoint shapes can adjust once we start building.
- Not a deployment runbook — that lives with the backend project once it exists.
- Not a security review — a separate threat-modeling pass is required before the API goes public.
