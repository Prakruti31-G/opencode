# ReferFlow AI 🚀
### Digital Internship Referral Management Platform
**Problem Statement 63** | **Team Name: TECH FOR GOOD** | **Domain: Software & Web Development**

> **"Every Referral. One Clear Journey."**
> *A transparent, intelligent, traceable, and efficient internship recruitment management platform.*

ReferFlow AI now runs as a **full-stack application on your machine**: a React + TypeScript frontend, an Express API, and a **real persistent SQLite database** at `data/recruitment.db`. Applicants register, build a profile, upload a resume and submit referrals; recruiters sign in, review submissions and approve / reject / request changes — with server-side authorization, notifications and a full status history.

On top of the referral workflow, ReferFlow AI adds an **AI internship platform**: an InternAI chat assistant, a questionnaire-driven **onboarding** flow, **internship discovery** over ~1,500 listings synchronized from [OpenIntern](https://openintern.dev), saved/internship tracking, **internship notifications**, resume intelligence, a learning roadmap, and recruiter AI suggestions. The AI layer uses **OpenRouter** (optional — everything degrades gracefully without a key; see [AI configuration](#-ai-configuration-openrouter)).

---

## 🧰 Technology Stack

| Layer | Technology | Details |
| :--- | :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite | Strict type checking, hash routing with role guards |
| **Styling** | Tailwind CSS | Docket-dark design language (ink surfaces, bone text, hairline rules, status colors), responsive |
| **Backend** | Node.js 20 + Express 5 | Plain ESM (`server/`), no build step required |
| **Database** | SQLite (`node-sqlite3-wasm`) | File-backed, survives restarts, parameterized SQL + transactions |
| **AI** | OpenRouter (Gemma default) | Optional; server-side key only, deterministic fallbacks everywhere |
| **Internship data** | OpenIntern | Daily dump sync into the local `internships` table (never called per-request) |
| **Auth** | Session cookie + bcrypt | httpOnly `rf_session`, CSRF token, rate limiting |
| **Uploads** | Private resume store | PDF/DOCX only, magic-byte validation, served through an authenticated endpoint |
| **Icons / Charts** | Lucide React, Recharts | Modern minimalist icons, funnel & relationship charts |

---

## 🚀 Local Setup (exact commands)

### Prerequisites
- **Node.js 20+** (built-in `node --test` runner is used for tests)
- **npm 10+**

### 1. Install dependencies

```bash
cd "C:\Users\Ritheesha H N\OneDrive\Documents\Referral Management"
npm install
```

### 2. Configure the environment (optional)

```bash
copy .env.example .env
```

All defaults work out of the box — including the AI features, which use deterministic fallbacks until you add an OpenRouter key (see [AI configuration](#-ai-configuration-openrouter)). `.env` is git-ignored — never commit real secrets.

### 3. Initialize the database

```bash
npm run db:init        # creates data/recruitment.db, seeds the recruiter + 6 baseline jobs
npm run db:seed-dev    # OPTIONAL: adds 6 demo applicants and 6 referrals
```

### 4. Synchronize internship listings

```bash
npm run sync           # pulls the OpenIntern dump into data/recruitment.db (idempotent)
```

This imports ~1,500 real internship postings into the local `internships` table. It is **idempotent** (re-running adds nothing new for identical data), preserves the previous dataset if OpenIntern is unreachable, and triggers internship notifications for opted-in applicants. The server can also sync automatically on a schedule (`SYNC_ENABLED`, default every 24 h). You can trigger and monitor syncs from the recruiter-only **Sync monitor** view (`#/sync-monitor`).

> Listings are provided by [OpenIntern](https://openintern.dev). The browser never talks to OpenIntern directly — all discovery reads the local database.

### 5. Start the app (API + frontend together)

```bash
npm run dev:all
```

Open **http://localhost:5173** — the Vite dev server proxies `/api` to the backend on port `5000`.

Prefer two terminals? Use:

```bash
# terminal 1
npm run dev:server     # API on http://localhost:5000
# terminal 2
npm run dev            # Vite on http://localhost:5173
```

### 6. Production-style run (single port)

```bash
npm run build          # tsc + vite build -> dist/
npm start              # serves dist/ and the API on http://localhost:5000
```

### 7. Tests

```bash
npm test               # node --test server/tests/  (65 tests: auth, referral workflow,
                       # persistence, rate limits, onboarding, discovery, sync,
                       # notifications, AI fallbacks + mocked OpenRouter)
```

---

## 🤖 AI configuration (OpenRouter)

The InternAI assistant, resume intelligence, AI explanations, roadmap enrichment and recruiter AI suggestions all go through **OpenRouter** (`https://openrouter.ai/api/v1`). Configuration lives entirely server-side in `.env`:

```env
OPENROUTER_API_KEY=            # your key from https://openrouter.ai/keys — never exposed to the browser
OPENROUTER_MODEL=google/gemma-4-31b-it:free   # default; any OpenRouter model id works
```

Key properties:

- **The API key never leaves the server.** It is not in the frontend bundle, and no API response ever contains it (tests assert this).
- **Graceful fallback everywhere.** Without a key, the whole app still works: chat returns deterministic answers computed from your real data (application statuses, matching listings, skill gaps) with a clear "AI not configured" note; scores, roadmaps and filters are always computed by backend logic, never by the model.
- **Bounded and rate-limited.** Per-user request budgets (`AI_RATE_MAX_PER_USER`, default 12 per 10 min), message/history length caps, response token caps and a per-request timeout. 429s and provider outages degrade to the deterministic path with honest messages.
- **Grounded answers.** The model is instructed to answer only from verified context (your profile, your saved/tracked internships, real synchronized listings). Listing references returned by the model are whitelisted against real database ids — it cannot invent internships, deadlines or links. Resume and listing text is treated as untrusted content (embedded instructions are ignored).
- **No silent model switching.** If the configured model id is wrong or unauthorized (401/404), the server reports the error and uses the deterministic fallback — it never quietly substitutes a different model.

**To change the model**, edit `OPENROUTER_MODEL` in `.env` and restart. Any model id OpenRouter accepts works; the default is Gemma's free build. Use the **Sync monitor** view (recruiter) to see whether AI is configured and which model is active.

**Email notifications** are not sent: notifications are delivered in-app and (optionally) as browser notifications when you enable them in Preferences. No mail provider is configured or required.

---

## 🔑 Sign-in Accounts

### Recruiter (staff) — seeded automatically

| Field | Value |
| :--- | :--- |
| Username | `admin` |
| Password | `admin@1234` |
| Sign-in | **Recruiter** tab on the sign-in screen → `POST /api/auth/recruiter-login` |

The account is created **idempotently**: restarting the server never overwrites an existing recruiter, and the credentials live only in the backend — they are never shipped in the frontend bundle.

**How to change the credentials:**

1. Edit `.env`:
   ```env
   RECRUITER_USERNAME=admin
   RECRUITER_PASSWORD=Choose-A-Strong-Password
   RECRUITER_FULL_NAME=Recruiter Admin
   RECRUITER_EMAIL=admin@referral.local
   ```
2. Delete only the recruiter row (or reset the whole DB):
   ```bash
   npm run db:reset     # destructive: deletes data/recruitment.db and re-seeds
   ```
   Or, to keep existing data, remove the recruiter row with any SQLite browser and restart — the seeder recreates it with your new password.
3. Restart the server (`npm run dev:server`). Existing sessions are invalidated when the DB is reset.

> ⚠️ Change `RECRUITER_PASSWORD` before sharing this repository.

### Applicants — self-service

Applicants register on the **Applicant** tab (`POST /api/auth/register`) with name, email, phone and password. If you seeded dev data, you can also sign in as:

| Email | Password |
| :--- | :--- |
| `aisha.khan@example.com` | `Applicant@123` |
| `rohan.verma@example.com` | `Applicant@123` |
| `meenakshi.iyer@example.com` | `Applicant@123` |
| `kabir.shah@example.com` | `Applicant@123` |
| `sneha.rao@example.com` | `Applicant@123` |
| `aditya.nair@example.com` | `Applicant@123` |

---

## 🗄️ Database & Files

| Path | Contents | Git |
| :--- | :--- | :--- |
| `data/recruitment.db` | SQLite database (users, profiles, jobs, referrals, notifications, status history, sessions, internships, sync runs, questionnaire responses, preferences, AI conversations/messages, roadmap progress) | ignored |
| `data/uploads/resumes/` | Private resume files (PDF/DOCX, random filenames) | ignored |
| `.env` | Local environment variables (incl. `OPENROUTER_API_KEY`) | ignored |
| `dist/` | Production build output | ignored |

Commands:

```bash
npm run db:init        # create schema + recruiter + baseline jobs (idempotent)
npm run db:seed-dev    # add demo applicants/referrals (idempotent)
npm run db:reset       # delete the DB file and re-init (destructive)
```

---

## 🔌 API Reference

All responses use the envelope `{ "ok": true, "data": … }` or `{ "ok": false, "error": { code, message } }`.
State-changing requests require the `x-csrf-token` header (sent automatically by the frontend from the readable `rf_csrf` cookie) and a valid session cookie.

### Auth
| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| POST | `/api/auth/register` | public | Applicant registration (rate limited) |
| POST | `/api/auth/login` | public | Applicant login (rate limited) |
| POST | `/api/auth/recruiter-login` | public | Recruiter login (rate limited) |
| GET | `/api/auth/me` | session | Current session user |
| POST | `/api/auth/logout` | session | End this session |
| POST | `/api/auth/logout-all` | session | End every session for the user |

### Profile & resume
| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| GET | `/api/profile` | applicant | Own profile |
| PUT | `/api/profile` | applicant | Update own profile |
| POST | `/api/profile/resume` | applicant | Upload resume (multipart, .pdf/.docx, magic bytes checked) |
| GET | `/api/profile/resume` | applicant | Preview own resume |
| DELETE | `/api/profile/resume` | applicant | Remove own resume |

### Jobs & referrals
| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| GET | `/api/jobs` | session | Active job listings |
| GET | `/api/jobs/:id` | session | One job listing |
| POST | `/api/referrals` | applicant | Submit a referral (duplicate active application → 409) |
| GET | `/api/referrals/mine` | applicant | Own referrals |
| GET | `/api/referrals/:id` | owner/recruiter | Detail + status history |
| PUT | `/api/referrals/:id` | owner | Update / resubmit (only from *Requires Changes*) |
| GET | `/api/referrals/:id/resume` | owner/recruiter | Authenticated resume download |

### Recruiter (server-side authorization on every route)
| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| GET | `/api/recruiter/stats` | recruiter | Live dashboard counters |
| GET | `/api/recruiter/referrals` | recruiter | Search, filter, sort, paginate |
| GET | `/api/recruiter/applicants` | recruiter | Applicant directory |
| GET | `/api/recruiter/referrals/:id` | recruiter | Detail + history |
| POST | `/api/recruiter/referrals/:id/action` | recruiter | `approve` / `reject` / `request_changes` (comment mandatory for reject & request changes, 409 on conflicting/duplicate actions) |

### Notifications
| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| GET | `/api/notifications` | session | Own notifications (referral + internship alerts) |
| POST | `/api/notifications/:id/read` | session | Mark one read (PATCH alias supported) |
| POST | `/api/notifications/read-all` | session | Mark all read (PATCH alias supported) |

### Internship discovery (reads the locally synchronized OpenIntern dataset)
| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| GET | `/api/discovery/meta` | applicant | Facets, freshness, attribution, AI-config flag |
| GET | `/api/discovery/internships` | applicant | Search + filters (q, role, region, season, duration, remote, sort, pagination) |
| GET | `/api/discovery/internships/:id` | applicant | Detail (with honest "unavailable" notice for inactive listings) |
| POST | `/api/discovery/internships/:id/save` | applicant | Save / unsave (toggle) |
| GET | `/api/discovery/saved` | applicant | Own saved internships |
| PUT | `/api/discovery/internships/:id/tracking` | applicant | Personal application tracking status + notes |
| GET | `/api/discovery/tracking` | applicant | Own tracking entries |
| GET | `/api/discovery/recommendations` | applicant | Categorized matches with backend-computed scores, breakdowns and disclaimer |
| POST | `/api/discovery/chat` | applicant | Internship-focused chat (AI when configured, deterministic otherwise; listings whitelisted) |

### Onboarding questionnaire
| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| GET | `/api/onboarding` | applicant | Current state: steps, saved answers, completion % |
| PUT | `/api/onboarding/answers` | applicant | Save answers incrementally (resume/reload safe; conditional questions adapt) |
| POST | `/api/onboarding/complete` | applicant | Validate + complete (400 lists missing required fields) |

### AI assistant (`/api/ai`)
| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| GET | `/api/ai/status` | applicant | Provider/model/configured flag + caps (never the key) |
| GET | `/api/ai/conversations` | applicant | Own conversation list |
| GET | `/api/ai/conversations/:id` | applicant | One conversation + messages (ownership enforced; 404 cross-user) |
| DELETE | `/api/ai/conversations/:id` | applicant | Delete own conversation |
| POST | `/api/ai/chat` | applicant | Chat message; returns reply, `mode` (`ai`/`unavailable`/`rate_limited`), model, real listings |
| POST | `/api/ai/resume-review` | applicant | AI resume review (or honest fallback listing detected skills) |
| POST | `/api/ai/internship-match/:id` | applicant | Deterministic match score vs a listing + AI explanation |
| GET | `/api/ai/learning-roadmap` | applicant | Roadmap from questionnaire (+ AI enrichment when configured); `?refresh=1` regenerates |
| PUT | `/api/ai/learning-roadmap/progress` | applicant | Save completed task ids |
| POST | `/api/ai/recruiter/referral-summary` | recruiter | AI summary **suggestion** for a referral |
| POST | `/api/ai/recruiter/compare` | recruiter | AI comparison suggestions (never auto-decides) |
| POST | `/api/ai/recruiter/interview-questions` | recruiter | Suggested interview questions |
| POST | `/api/ai/recruiter/feedback-draft` | recruiter | Draft feedback text |
| GET | `/api/ai/recruiter/workload` | recruiter | Real workload counts + summary |

### Preferences
| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| GET | `/api/preferences` | applicant | Own preferences (derived-from-questionnaire included) |
| PUT | `/api/preferences` | applicant | Update target roles, skills, locations, work mode, threshold, frequency, toggles |

### Admin / sync (recruiter only)
| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| GET | `/api/admin/sync` | recruiter | Integration status: totals, last run/success/error, staleness |
| GET | `/api/admin/sync/runs` | recruiter | Recent sync runs |
| POST | `/api/admin/sync/run` | recruiter | Trigger a sync now (409 when already running, 429 during cooldown) |
| GET | `/api/admin/config` | recruiter | Non-secret configuration view |

| GET | `/api/health` | public | Liveness + row counts |

---

## 🔒 Security Model

- **Passwords** hashed with bcrypt (12 rounds); never stored or logged in plaintext.
- **Sessions** are server-side rows; the browser only holds an httpOnly, SameSite=Lax `rf_session` cookie (TTL `SESSION_TTL_HOURS`, default 8 h).
- **CSRF** double-submit: readable `rf_csrf` cookie must be echoed in the `x-csrf-token` header, and the `Origin`/`Referer` is validated.
- **Rate limiting** on login and registration (per IP, configurable via `LOGIN_RATE_*` / `REGISTER_RATE_*`).
- **Authorization** is enforced in the API, not the UI: an applicant token can never call `/api/recruiter/*`, and a recruiter token can never read another applicant's profile or submit referrals. The frontend additionally blocks recruiter/applicant routes in the URL (`#/view`) for a better error experience.
- **SQL** is fully parameterized; writes that must be atomic run inside transactions.
- **Resumes** are stored outside the web root under `data/uploads/resumes/`, named with random identifiers, validated by magic bytes (PDF `%PDF`, DOCX `PK`), size-capped (5 MB) and only reachable through an authenticated endpoint with an owner-or-recruiter check.
- **Headers**: CSP, X-Content-Type-Options, X-Frame-Options, Referrer-Policy and a CORS allowlist.
- **AI layer**: the OpenRouter key is server-side only (never in the bundle, never in responses — tests assert this). AI output is **suggestion-only**: it can never approve/reject referrals, and recommendation scores are computed by deterministic backend logic that the model merely explains. Resume and listing text is passed to the model as untrusted content behind a system prompt that forbids following embedded instructions; listing ids the model returns are whitelisted against real database rows. Per-user AI rate limits, message/history caps and timeouts bound cost and abuse.

---

## 🧪 Test Suite

```bash
npm test
```

`server/tests/` covers:

- **auth.test.js** — registration validation, duplicate email, login/logout, recruiter login, session invalidation, bcrypt storage.
- **referral-workflow.test.js** — submit, recruiter list/search/filter/sort/pagination, approve, reject (comment required), request changes (comment required), duplicate/conflicting action → 409, notifications and `referral_status_history` rows, applicant resubmission.
- **persistence.test.js** — data survives closing and reopening the database file.
- **rate-limit.test.js** — login attempts are blocked after the configured threshold.
- **discovery-ai.test.js** — the internship platform end to end against a temp database and a real HTTP server:
  - **Sync** — dump ingestion with stable external ids, idempotent re-syncs, failed runs preserve the previous dataset (and are logged), complete-snapshot deactivation without deletion, in-batch duplicate prevention.
  - **Onboarding** — incremental save/resume, conditional questions following the education level, completion validation with a `firstIncompleteStep` hint, preference derivation.
  - **Notifications** — opt-in respected (disabled/threshold-high applicants get none), internship alerts link real listings, no duplicates on re-sync, per-user isolation, mark-all-read.
  - **Recommendations & discovery** — scores computed by backend logic over real stored rows (integers 0–100 with breakdowns and an honesty disclaimer), search/detail/save/tracking with cross-user isolation, inactive listings stay reachable with an honest notice, facets/attribution exposed.
  - **AI** — status never leaks the key, unconfigured mode returns deterministic answers, a **mocked OpenRouter** verifies the exact configured model id is sent with a grounding system prompt and conversation history, invented listing ids are filtered out, provider outages/rate limits degrade gracefully (HTTP 200 + `mode`), per-user rate limiting, message length caps, conversation ownership (cross-user → 404), unauthenticated → 401.
  - **Authorization** — admin sync endpoints recruiter-only; recruiter AI endpoints applicant-forbidden, suggestion-only (referral status unchanged after AI calls).
  - A live OpenRouter call is exercised automatically when `OPENROUTER_API_KEY` is present in the environment; otherwise all AI tests run against the stubbed provider.

Each test file uses an isolated temp database and uploads directory, so tests never touch `data/recruitment.db`.

---

## 🧭 Application Map

| Area | Role | Views |
| :--- | :--- | :--- |
| Recruiter home | Recruiter | `#/overview` live dashboard (real DB counters) |
| Referrals | Recruiter | `#/referrals` table + `#/referral-detail` dossier with resume preview/download, actions and the **AI assistance panel** (summary / compare / questions / feedback — suggestions only) |
| Sync monitor | Recruiter | `#/sync-monitor` OpenIntern status, run history, "Run sync now", AI-config row |
| Existing features | Recruiter | `#/demo-overview`, `#/candidates`, `#/duplicates`, `#/eligibility`, `#/pipeline`, `#/opportunities`, `#/ai-matching`, `#/copilot`, `#/insights`, `#/relationship-graph`, `#/analytics`, `#/audit-logs`, `#/settings`, `#/demo-tour` |
| Applicant home | Applicant | `#/applicant-dashboard` |
| Onboarding | Applicant | `#/onboarding` adaptive questionnaire (saves incrementally, resumes where you stopped) |
| Discover | Applicant | `#/discover` recommendations + search/filters over synced internships |
| Internship detail | Applicant | `#/internship-detail` dossier, save, tracking status, apply link |
| My internships | Applicant | `#/my-internships` saved + application tracking |
| InternAI assistant | Applicant | `#/assistant` chat with history, suggested questions, grounded answers |
| Resume analysis | Applicant | `#/resume-analysis` AI resume review + compare against an internship |
| Learning roadmap | Applicant | `#/roadmap` skill milestones with progress tracking |
| Preferences | Applicant | `#/preferences` roles/skills/locations, thresholds, notification settings |
| My referrals | Applicant | `#/applicant-referrals` status cards, feedback, history, *Update & Resubmit* |
| Job board | Both | `#/jobs` live listings with Apply → prefilled submission form |
| Submit / profile | Applicant | `#/submit-referral`, `#/applicant-profile` |
| Notifications | Both | `#/notifications` (referral + internship alerts, mark-all-read, browser notifications) |

Sign-in screen, profile menu with **Sign out**, toasts, loading/error/retry states, status badges and responsive layouts (including a mobile bottom navigation) are shared across the app.

---

## 🛠️ Troubleshooting

| Symptom | Fix |
| :--- | :--- |
| Assistant says "AI not configured" | Set `OPENROUTER_API_KEY` in `.env` and restart the server. Everything else works without it. |
| Assistant says "rate limited" | Per-user budget reached (default 12 requests / 10 min) or OpenRouter throttled. Wait a minute, or raise `AI_RATE_MAX_PER_USER` / `AI_RATE_WINDOW_MS`. |
| AI answers feel generic or model errors appear | Check `OPENROUTER_MODEL` is a valid OpenRouter model id your key can access; check the Sync monitor AI row. The server never silently switches models. |
| Discover shows no recommendations | Run `npm run sync` to import listings, and complete the onboarding questionnaire — recommendations need both. |
| Internship notifications not arriving | Check Preferences: notifications enabled, frequency (daily/weekly) and minimum match score. New listings trigger matching after each sync. |
| `EADDRINUSE: port 5000 in use` | Stop the other API process, or set `PORT=5001` in `.env` (update the Vite proxy target in `vite.config.ts` accordingly). |
| `EADDRINUSE: port 5173 in use` | Stop the stale Vite process (`Get-Process node` → `Stop-Process -Id <id>`), or run `npm run dev -- --port 5174`. |
| `EPERM … node_modules\.vite\deps` on Windows | Close the editor/antivirus lock and delete `node_modules\.vite`, then restart `npm run dev`. |
| "Cannot reach the server" in the UI | Start the API: `npm run dev:server`. Health check: <http://localhost:5000/api/health>. |
| "Your session has expired" | Sign in again; sessions live in the DB and are cleared by `npm run db:reset`. |
| Recruiter login rejected | Ensure `npm run db:init` ran and `RECRUITER_PASSWORD` matches what you typed. |
| Tests fail to start | Run `npm install` first; tests create their own temp DB. |
| Want a clean slate | `npm run db:reset && npm run db:seed-dev` (deletes `data/recruitment.db`). |
| Port/proxy confusion in production build | `npm run build && npm start` serves everything from `http://localhost:5000`. |

---

## 📄 Team Information
- **Problem Statement:** PS 63 - Digital Internship Referral Management
- **Team Name:** TECH FOR GOOD
- **Domain:** Software & Web Development
- **Status:** Full-stack, locally runnable, tested
