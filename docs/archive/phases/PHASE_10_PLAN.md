# Phase 10 — CI gates: browser suite in CI, generated-content drift check, deploy waits for CI (PLAN)

**Status:** Done — owner sign-off 2026-09-28 (with the standing authorization to merge on green CI); built, merged (PR #42, squash `eb7cc97`) and rolled out through the new gate the same day (4 m 13 s merge → live). Archived; the outcome is in `docs/PROJECT_STATE.md` → "Phase 10".
**Date:** 2026-09-28
**Predecessors:** Phase 9 live (PR #40, `6a0a533`); review P0 closed (PRs #37, #38).
**Parent references:**
- [`docs/PRODUCT_REVIEW_2026-09-28.md`](./PRODUCT_REVIEW_2026-09-28.md) — P1 item 8, "Gate the deploy and run the browser suite (S)": _`deploy.yml` triggers on `push: main` with no `needs`/`workflow_run` on `ci.yml`; `ci.yml` has no Playwright step and runs `validate-content` after `build`, so stale `_generated.ts` passes._
- [`HANDOFF.md`](../HANDOFF.md) — "Next pick after the merge: review P1 item 8 — CI gate + Playwright in CI + the `gen-content` diff check + `workflow_run: CI → success` on the deploy; the bundle-budget CI step from 9d is the seed."
- [`docs/DEPLOY.md`](./DEPLOY.md) §2 / §4 / §9 — the pipeline this phase changes.
- [`docs/archive/phases/PHASE_9_PLAN.md`](./archive/phases/PHASE_9_PLAN.md) — structure template; its D7 (bundle budget step) is the seed this phase grows.

## Why this is the next phase

Read from `.github/workflows/ci.yml` + `deploy.yml` and the run history on 2026-09-28 (CI run `36456013702` and Deploy run `36456013697`, both for `6a0a533` on `main`):

| What | Today | After this phase |
| --- | --- | --- |
| Deploy waits for CI | No. `deploy.yml` and `ci.yml` both fire on `push: main`, in parallel; a red CI still rolls out (`DEPLOY.md` §4 literally says "treat a red CI on `main` as revert-now") | Yes. Deploy is triggered by CI's `workflow_run` and runs only on `conclusion == success` |
| Browser suite | Local only — 34 tests, Chromium desktop + mobile = 68 runs, last run by hand for Phase 9; CI never runs it | A second CI job on every PR and every push to `main` |
| Stale `_generated.ts` / `_generated.articles.ts` | Passes CI (`validate-content` checks the JSON, not the generated pair; the pair is only ever refreshed by hand) | Fails CI in ≈ 5 s, naming the stale files |
| `pnpm format` on the generated pair | Would rewrite both files (prettier does not ignore them: double → single quotes) | Ignored by prettier, so the drift check cannot be tripped by a formatter |
| CI wall time on `main` | 1 m 03 s (one job: install 5 s, lint 5, typecheck 7, test 12, build 22, budget 1, validate 1) | ≈ 3–4 min (two jobs in parallel; the e2e job is the long one) |
| Merge → live | ≈ 2 m 45 s (image 2 m 21 s + rollout 20 s, started at the push, parallel with CI) | ≈ 6 min (CI green first, then image, then rollout) |

Three gaps, all in the pipeline, none in the app. Each fix is a YAML change plus one line of Playwright config; nothing under `apps/` or `packages/` changes behaviour. The one real cost is the last row: about three minutes more between a merge and the live site, which is the price of not deploying a red commit.

---

## 1. Locked decisions

Proposed 2026-09-28 from a read of the two workflows, the run timings above, `.prettierignore`, `playwright.config.ts` and the e2e directory. Each needs the owner's "da" (or a change) before code.

### D1 — The generated pair is checked against the JSON, before anything builds

A step in the existing `validate` job, right after `pnpm install` and `pnpm validate-content`:

```yaml
- name: Generated content is current
  # _generated.ts + _generated.articles.ts must be what `pnpm gen-content` produces
  # from content/courses/**. `add -N` makes a brand-new generated file show up too.
  run: |
    pnpm gen-content
    git add -N packages/content/src/courses
    if ! git diff --quiet -- packages/content/src/courses; then
      echo "::error::packages/content/src/courses/**/_generated*.ts is stale — run 'pnpm gen-content' and commit the result."
      git --no-pager diff --stat -- packages/content/src/courses
      exit 1
    fi
```

**Why before `build`:** it fails in ≈ 5 s instead of after the 40 s of lint / typecheck / test / build, and it is the check the review item names. `validate-content` moves up next to it (it validates the JSON the codegen reads; 1 s). The `validate` job order becomes: install → validate-content → generated content current → lint → typecheck → test → build → bundle budget.

**Why `git diff` and not a checksum file:** the codegen is deterministic (`JSON.stringify` of one load, LF line endings, no timestamps — Phase 9 recorded it as idempotent on the committed tree), and the runner checks out LF, so the working tree after `pnpm gen-content` is byte-identical to the commit whenever the pair is current. On the laptop, `core.autocrlf=true` normalizes CRLF before comparing, so the same two commands are clean there too.

**Why `.prettierignore` gets `**/_generated*.ts`:** `pnpm format` (root script, `prettier --write .`) would rewrite both files — single quotes, trailing commas — and the next CI run would fail on a diff nobody meant. ESLint already ignores the pair since Phase 9; prettier is the one tool that does not.

**What this does not do:** regenerate for you. The local half of the "forgot `pnpm gen-content`" foot-gun (a pre-commit hook) stays out (§8); CI now catches the miss before it can reach `main`.

### D2 — Playwright is a second CI job: Chromium desktop + mobile, in parallel with `validate`

```yaml
e2e:
  name: E2E (Chromium desktop + mobile)
  runs-on: ubuntu-latest
  timeout-minutes: 20
  steps:
    - Checkout / Setup pnpm / Setup Node (cache: pnpm) / pnpm install --frozen-lockfile   # same four steps as validate
    - name: Install Chromium
      run: pnpm --filter @learn365/web exec playwright install --with-deps chromium
    - name: Build
      run: pnpm build                                   # turbo: @learn365/ui first, then the web app
    - name: Playwright
      run: pnpm --filter @learn365/web exec playwright test --project=chromium-desktop --project=chromium-mobile
    - name: Upload traces
      if: failure()
      uses: actions/upload-artifact@v4
      with: { name: playwright-traces, path: apps/web/test-results/, retention-days: 7 }
```

**Why its own job, not a step after `Bundle budget`:** it runs in parallel with `validate`, so CI wall time is the longer of the two, not the sum (the repo is public, so runner minutes are free); a red e2e is its own line in the PR checks list; and a 20-minute timeout on a browser job does not stretch the 15-minute budget of the lint/build job.

**Why rebuild instead of handing `.next` over as an artifact:** `pnpm build` is 22 s on the runner. Uploading and downloading `.next` (≈ 60 MB with the 366 prerendered pages) costs about the same and adds an artifact hand-off to keep correct.

**Why Chromium only:** it is what every local run since Phase 5 has used (Firefox / WebKit browsers are not installed on the dev machine), and the suite's only browser-specific paths are the two documented WebKit skip-link skips. The three other profiles stay in `playwright.config.ts` for a local full run; adding them to CI is a one-line follow-up once the Chromium job has been stable for a while.

**Accounts off:** the job sets no env vars, so the app is the pre-Phase-8 app — exactly how Phase 8 designed CI and how the suite runs locally (`e2e/auth-off.spec.ts` asserts that state).

**Config change, one line:** `reporter: process.env['CI'] ? [['list'], ['github']] : 'list'` — the `github` reporter annotates failures on the PR. `retries: 2` on CI and `trace: 'on-first-retry'` are already there, so a failure that survives the retries leaves a trace in the uploaded `test-results/`.

### D3 — Deploy is triggered by CI's success, not by the push

```yaml
on:
  workflow_run:
    workflows: [CI]
    types: [completed]
    branches: [main]
  pull_request:          # unchanged — build-only run when deploy files change
    paths: [...]
  workflow_dispatch:     # unchanged — manual rollout of HEAD of main

env:
  IMAGE: ghcr.io/${{ github.repository_owner }}/learn365-web
  # The commit to build: the one CI just validated (workflow_run), else this run's own.
  SHA: ${{ github.event.workflow_run.head_sha || github.sha }}

jobs:
  image:
    if: github.event_name != 'workflow_run' || (github.event.workflow_run.conclusion == 'success' && github.event.workflow_run.event == 'push')
    steps:
      - uses: actions/checkout@v4
        with:
          ref: ${{ env.SHA }}
      …
      - name: Image tag
        run: echo "tag=sha-${SHA::12}" >> "$GITHUB_OUTPUT"
```

The `deploy` job keeps `needs: image` and `if: github.event_name != 'pull_request'`; when `image` is skipped, `deploy` is skipped with it.

**Why `head_sha` explicitly:** a `workflow_run`-triggered run's own `github.sha` is the tip of `main` at trigger time, which can be a later commit than the one CI validated (two merges a minute apart). Pinning both the checkout and the image tag to `workflow_run.head_sha` keeps "what CI passed" and "what gets deployed" the same commit; on `pull_request` and `workflow_dispatch` the expression falls back to `github.sha` as today.

**Why the `event == 'push'` clause:** CI also runs on `pull_request`. `branches: [main]` already filters on the triggering run's head branch, so PR runs never match; the clause is belt-and-braces against a branch literally named `main` in a fork.

**A red CI now means: nothing deploys.** The Deploy run appears as skipped; the previous image stays live; the CI failure e-mail is the signal. `workflow_dispatch` remains the emergency bypass (builds and rolls out HEAD of `main` without waiting for CI) and is documented as exactly that.

**What it costs:** ≈ 3 minutes more between merge and live (see the table). Accepted as the price of the gate.

**Rejected alternative:** keep the image build on `push: main` (parallel with CI) and gate only the rollout via `workflow_run`. It would save ≈ 2 minutes but splits the pipeline across two triggers that must agree on a tag and wait for each other's image (the rollout could fire before the image is pushed). Not worth it at six minutes total.

### D4 — `DEPLOY.md`'s rule flips

§4 "Routine deploy" today: _"CI and Deploy run in parallel. A red CI does **not** block the rollout — treat a red CI on `main` as revert-now."_ After this phase: _"Deploy waits for CI (`workflow_run`). A red CI on `main` deploys nothing — fix forward; the previous image stays live. `gh workflow run deploy.yml` bypasses the gate and is for emergencies only."_ The §2 table row for `deploy.yml`, the §9 status table (one new row with the measured merge-to-live time) and `APP_ARCHITECTURE.md` §12 (which already promises `→ e2e (web)` at the end of the CI line — it becomes true) change with it.

### D5 — Nothing changes in the app, the image or the VPS

No file under `apps/` or `packages/` changes except the one reporter line in `apps/web/playwright.config.ts`. The Dockerfile, `deploy/*.sh`, compose, GitHub secrets and variables: untouched. `main` has no branch protection today (verified 2026-09-28: `gh api …/branches/main/protection` → 404, `…/rulesets` → `[]`); this phase does not add one by code — the deploy gate is the hard guard, and requiring the checks before merge is an optional owner action (§3).

### D6 — One PR, three commits, each green on its own

- **10a — Drift check.** `ci.yml` (step + order), `.prettierignore`.
- **10b — Browser suite.** `ci.yml` (the `e2e` job), `playwright.config.ts` (reporter).
- **10c — Deploy gate + docs.** `deploy.yml`, `DEPLOY.md`, `APP_ARCHITECTURE.md`, `PROJECT_STATE.md`, `HANDOFF.md`.

10c's `workflow_run` trigger cannot be exercised on the PR — GitHub evaluates it against the workflow file on the default branch, so it takes effect from the merge commit itself (§5 says how that first run is checked).

---

## 2. Scope reframe — what Phase 10 is, and what it is not

Phase 10 is a **pipeline** phase: same app, same image, same box; different rules for what may reach the box. It changes when the deploy starts (after CI, not with it), what CI checks (the generated pair and the browser suite, on top of lint / typecheck / test / build / budget / content), and the documented rule for a red `main`.

It is not: Firefox / WebKit in CI, Lighthouse or the screenshot pack in CI, `format:check` in CI, a pre-commit hook for `gen-content`, rollback-on-failed-health in `deploy.sh` (review item 11), type-checking `e2e/` or `core-web-vitals` lint (item 21), `paths-ignore` for docs-only pushes, a Playwright browser cache, or branch protection.

---

## 3. Owner actions

None required — no secret, variable, DNS, Cloudflare or VPS change.

Optional, recommended once both checks have been green on a few PRs: require them before merge (GitHub → Settings → Branches → add a rule for `main` → "Require status checks to pass" → `Lint, typecheck, test, build` and `E2E (Chromium desktop + mobile)`). A dashboard action, not done by code; it makes a PR merge wait for CI the way the deploy already will.

---

## 4. File-level bundle

### 10a — Drift check

- `.github/workflows/ci.yml` — move `Validate content` up to right after `Install dependencies`; add `Generated content is current` (D1) after it; `Lint` → `Typecheck` → `Test` → `Build` → `Bundle budget` unchanged.
- `.prettierignore` — add `**/_generated*.ts`.

Gate: locally, `pnpm gen-content && git add -N packages/content/src/courses && git diff --quiet -- packages/content/src/courses` exits 0 on the committed tree; then break it on purpose (change a `title` in `content/courses/istorija-srbije-365/lessons/day-001.json`, no regen) → exits 1 and `--stat` names `_generated.ts` + `_generated.articles.ts`; `git checkout -- content packages/content/src/courses` to restore. `pnpm format:check` no longer touches the pair. CI on the PR green with the step at ≈ 5 s.

### 10b — Browser suite

- `.github/workflows/ci.yml` — the `e2e` job (D2), no `needs`, `env: NEXT_TELEMETRY_DISABLED: 1` at workflow level for both jobs.
- `apps/web/playwright.config.ts` — the `reporter` line.

Gate: the `e2e` job green on the PR with the expected counts (67 pass / 1 skip; the skip is the desktop-profile "meta row stays visible while scrolling" N/A), its wall time recorded in the PR description; re-run the job once from the Actions tab to catch a runner-only flake before the gate goes live. If a spec flakes on the runner and not locally, quarantine that one test (`test.fixme` with a dated note) rather than dropping the job.

### 10c — Deploy gate + docs

- `.github/workflows/deploy.yml` — triggers, `env.SHA`, the `image` job's `if`, checkout `ref`, tag from `SHA` (D3). Header comment updated ("push to main" → "CI green on main").
- `docs/DEPLOY.md` — §2 table row for `deploy.yml`; §4 rule (D4); §6 "Rollback": add that a red CI is not a rollback case (nothing was deployed); §9 status table: one row "CI-gated deploy + browser suite in CI — done (date), merge → CI green → Deploy → live in N min".
- `docs/APP_ARCHITECTURE.md` §12 — the CI line becomes `install → validate-content → gen-content drift → lint → typecheck → test → build → bundle budget` ∥ `e2e (Chromium desktop + mobile)`; one sentence that Deploy runs on CI success.
- `docs/PROJECT_STATE.md` — baseline "Build/test gates" bullet (34 tests × Chromium desktop + mobile now in CI; drift check; deploy gated), the "CI:" line under the tooling list, and a "Phase 10 — done" entry.
- `HANDOFF.md` — the "every push to `main` builds the image" sentence → "every green CI on `main`"; next-step pointer.
- Move this plan to `docs/archive/phases/PHASE_10_PLAN.md` on merge.

Gate: the `pull_request` build-only run of `deploy.yml` is green on the PR (YAML valid, image builds). After the merge: `gh run list --workflow=CI --limit 1` shows the push run green, then `gh run list --workflow=Deploy --limit 1` shows a run whose event is `workflow_run`, whose image tag is `sha-<first 12 of the merge commit>`, and whose rollout is green; `curl -s https://istorija365.com/api/health` → `{"ok":true,"auth":true,"db":"ok"}`; `IMAGE_TAG` in `/srv/learn365/.env` equals that tag.

---

## 5. Verification (whole phase)

- On the PR: both CI jobs green; `deploy.yml` build-only run green; the e2e job's time and counts in the PR description.
- Drift check, red path: proven locally as in §4 (10a). Not pushed as a throwaway red commit — the step's logic is two git commands, and the green path on the PR proves the wiring.
- Deploy gate, green path: the merge commit itself, as in §4 (10c) — three timestamps (merge, CI green, live) recorded in `DEPLOY.md` §9.
- Deploy gate, red path: not exercised on `main` on purpose (it would need a broken commit). The `if` expression is the documented form for this trigger. If no Deploy run appears within a minute of CI going green, the fault is in the trigger, not on the box: `gh workflow run deploy.yml` rolls out by hand and the trigger is fixed forward.
- Nothing to check on the VPS beyond `/api/health` and the running tag; Računi untouched by construction (no `deploy/` file changes).

---

## 6. Risks

- **A flaky browser test now blocks a deploy.** Mitigations already in place: `retries: 2` on CI, the two conditional skips are deterministic, prerendered pages make the suite faster and steadier than it was pre-Phase 9. Rule: quarantine the one test, never the job; `workflow_dispatch` is the bypass while a flake is being fixed.
- **`workflow_run` cannot be rehearsed on the PR.** The merge commit is the first real run (§5); the manual dispatch is the fallback. Because GitHub reads `deploy.yml` from `main`, the gate applies from that very commit — there is no window where a red CI could still deploy.
- **Merge → live grows from ≈ 3 to ≈ 6 minutes.** Stated in the table; accepted by D3.
- **`playwright install --with-deps` time varies (20–60 s, apt).** If the e2e job drifts past ≈ 5 minutes, cache `~/.cache/ms-playwright` keyed on the Playwright version (`1.60.0` in the lockfile) — a five-line follow-up, not part of this phase.
- **Where to see the Deploy run.** A `workflow_run`-triggered run is listed in the Actions tab under "Deploy", not among the commit's own checks. `gh run list --workflow=Deploy` (already the habit, see `gh-pr-checks-watch-race` in memory) is the way to watch it.
- **Docs-only pushes still run the full CI and a deploy** (as today), now at ≈ 6 minutes. Harmless; a `paths-ignore` on CI would also skip the deploy for docs-only commits, which is a reasonable follow-up but changes the "every push deploys" rule and is kept out (§8).
- **`git add -N` on the laptop.** If someone runs the local one-liner from §4, `git add -N` leaves intent-to-add entries only when a new generated file exists — `git reset` clears them. On the runner the checkout is ephemeral.
- **Two `pnpm install` + two `pnpm build` per CI run.** ≈ 30 s of duplicated runner work per run; free on a public repo, and cheaper than the artifact hand-off it avoids.

---

## 7. How to proceed

1. **Owner signs off on D1–D6**, or changes them. The two worth a look: D2 (Chromium only in CI) and D3 (≈ 3 minutes more to live, and a red `main` no longer deploys).
2. **Branch `feat/phase-10-ci-gates` off `main`**; commits 10a → 10b → 10c, each green on its gates before the next.
3. **Open the PR** with the e2e job time and counts in the description; both jobs green; the deploy build-only run green.
4. **Merge** (squash), then watch `gh run list --workflow=CI` → `--workflow=Deploy` for the first gated rollout and record the three timestamps. Then the "Phase 10 — done" entry in `PROJECT_STATE.md`, this file moved to `docs/archive/phases/`, and `HANDOFF.md` pointed at the next pick — the remaining P1 items are 9 (trust scaffolding, editorial work), 10 (honest reading time, S, engineering), 11 (backend reliability set) and 12 (era rail truncation); item 10 is the natural next S.

---

## 8. Out-of-scope reminders

This plan deliberately does **not** touch:

- The app, the content, the image, `deploy/*`, the VPS, secrets or variables.
- Firefox / WebKit profiles in CI (config keeps them for local runs).
- Lighthouse, the screenshot pack, `format:check` or a Playwright browser cache in CI.
- A pre-commit / `prebuild` auto-regen of the generated pair (the local half of the foot-gun; HANDOFF's quality-of-life item).
- `paths-ignore` for docs-only pushes.
- Branch protection or rulesets on `main` (optional owner action, §3).
- Review item 11 (`deploy.sh` rollback on failed health, DB timeouts, backup hardening) and item 21 (type-check `e2e/`, `core-web-vitals` lint).
