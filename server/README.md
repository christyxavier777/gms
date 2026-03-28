# Gym Management Backend (Phases 0-7)

Academic/demo-grade backend API for a gym management system. Core backend scope is complete through Phase 7 (hardening), and this repository is prepared for frontend integration.

## Completed Phase Breakdown

- Phase 0: Foundation (TypeScript + Express + Prisma + env bootstrap + `/health`)
- Phase 1: Authentication and roles (JWT, register/login/me, auth middleware)
- Phase 2: User and member lifecycle management
- Phase 3: Workout and diet plan CRUD + assignment
- Phase 4: Subscription lifecycle (no payments)
- Phase 5: Progress tracking (append-only, admin correction delete)
- Phase 6: Role-based read-only dashboards
- Phase 7: Security hardening and stabilization (helmet, rate limits, sanitization, normalized errors)

## Operational Endpoints

- `GET /health/live`: process liveness metadata without dependency checks
- `GET /health/ready`: structured readiness report for PostgreSQL and cache/Redis state
- `GET /health`: backwards-compatible health summary with dependency details included
- `GET /dashboard/admin/performance`: infra observability plus business-flow metrics for onboarding funnel progress and payment review outcomes

## Tech Stack

- Runtime: Node.js
- Language: TypeScript
- Framework: Express
- ORM: Prisma
- Database: PostgreSQL
- Auth: JWT + bcrypt
- Validation: Zod
- Cache: Redis (with in-memory fallback)
- Security middleware: helmet, express-rate-limit

## Folder Structure

```text
server/
  prisma/
    schema.prisma
    migrations/
  src/
    index.ts
    app.ts
    config/
      env.ts
    auth/
    users/
    plans/
    subscriptions/
    progress/
    dashboard/
    jobs/
    routes/
    middleware/
    prisma/
    scripts/
    types/
  docs/
    openapi.yaml
    ARCHITECTURE.md
    ERD.mmd
  .env.example
  package.json
```

## Environment Variables

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `NODE_ENV` | No | `development` | Runtime mode (`development`/`production`) |
| `PORT` | Yes | - | HTTP port |
| `DATABASE_URL` | Yes | - | Prisma datasource URL |
| `REDIS_URL` | No | - | Redis connection URL for distributed cache/rate-limit state |
| `DASHBOARD_CACHE_TTL_SEC` | No | `45` | Dashboard cache TTL in seconds |
| `SLO_LATENCY_P95_MS` | No | `300` | p95 latency SLO threshold (milliseconds) |
| `SLO_ERROR_RATE_PCT` | No | `1` | 5xx error-rate SLO threshold (percent) |
| `JWT_SECRET` | Yes | - | JWT signing secret |
| `JWT_EXPIRES_IN` | Yes | - | JWT TTL (example: `1d`) |
| `CORS_ALLOWED_ORIGINS` | No | `http://localhost:5173,http://127.0.0.1:5173` in local dev | Comma-separated frontend origins allowed to call the API |
| `COOKIE_SECURE` | No | `false` locally, `true` recommended in production | Whether auth session cookies require HTTPS |
| `COOKIE_SAME_SITE` | No | `lax` | Cookie SameSite mode (`lax`, `strict`, `none`) |
| `COOKIE_DOMAIN` | No | - | Optional shared cookie domain for deployed environments |
| `ADMIN_NAME` | No | - | Seed admin display name (`seed:admin` only) |
| `ADMIN_EMAIL` | No | - | Seed admin email address (`seed:admin` only) |
| `ADMIN_PASSWORD` | No | - | Seed admin password (`seed:admin` only) |
| `DEMO_EMAIL_DOMAIN` | No | `demo.gms.local` | Email domain used by `seed:demo` personas |
| `DEMO_ADMIN_PASSWORD` | No | `DemoAdmin123` | Demo admin password for `seed:demo` |
| `DEMO_TRAINER_PASSWORD` | No | `DemoTrainer123` | Demo trainer password for `seed:demo` |
| `DEMO_MEMBER_PASSWORD` | No | `DemoMember123` | Shared demo member password for `seed:demo` |
| `SMOKE_BASE_URL` | No | `http://127.0.0.1:4000` | Base URL targeted by `smoke:critical` |
| `SMOKE_ADMIN_EMAIL` | No | falls back to `ADMIN_EMAIL` | Admin email used by `smoke:critical` |
| `SMOKE_ADMIN_PASSWORD` | No | falls back to `ADMIN_PASSWORD` | Admin password used by `smoke:critical` |
| `SMOKE_MEMBER_PASSWORD` | No | `SmokeTest123` | Password used for the generated smoke-test member |
| `SMOKE_PLAN_ID` | No | first active plan | Optional explicit membership plan for `smoke:critical` |
| `SMOKE_UPI_ID` | No | `smoke.member@okaxis` | UPI handle used for smoke-test payment submission |
| `JSON_BODY_LIMIT` | No | `100kb` | Global JSON/urlencoded request size cap |
| `AUTH_RATE_LIMIT_WINDOW_MS` | No | `900000` | Shared auth/login throttle window |
| `AUTH_RATE_LIMIT_MAX` | No | `20` | Max auth requests per IP window and max login attempts per email/IP window |
| `MUTATION_RATE_LIMIT_WINDOW_MS` | No | `60000` | Mutation limiter window |
| `MUTATION_RATE_LIMIT_MAX` | No | `120` | Max write requests/window |
| `WEARABLE_SYNC_RATE_LIMIT_WINDOW_MS` | No | `60000` | Wearable sync limiter window |
| `WEARABLE_SYNC_RATE_LIMIT_MAX` | No | `30` | Max wearable sync requests/window |
| `WEARABLE_WEBHOOK_TOLERANCE_SEC` | No | `300` | Max allowed signature timestamp drift for wearable webhooks |
| `WEARABLE_WEBHOOK_DEDUPE_TTL_SEC` | No | `86400` | Retention window for processed webhook event IDs (idempotency) |
| `WEARABLE_AUDIT_DB_TIMEOUT_MS` | No | `250` | Timeout for wearable audit DB reads/writes before memory fallback |
| `SUBSCRIPTION_EXPIRY_INTERVAL_MS` | No | `300000` | Worker interval for expiring overdue subscriptions |
| `WEARABLE_AUDIT_RETENTION_DAYS` | No | `30` | Retention period for persisted wearable webhook audit rows |
| `WEARABLE_AUDIT_CLEANUP_INTERVAL_MS` | No | `3600000` | Background cleanup interval for audit row retention |
| `WEARABLE_WEBHOOK_SECRET_FITBIT` | No | - | HMAC secret for Fitbit webhook signature validation |
| `WEARABLE_WEBHOOK_SECRET_APPLE_WATCH` | No | - | HMAC secret for Apple Watch webhook signature validation |
| `WEARABLE_WEBHOOK_SECRET_GENERIC` | No | - | HMAC secret for generic provider webhook signature validation |

## Local Setup

1. Install dependencies

```bash
npm install
```

2. Create environment file

```bash
cp .env.example .env
```

3. Apply migrations

```bash
npm run prisma:migrate:deploy
```

4. Generate Prisma client

```bash
npm run prisma:generate
```

5. Seed admin user (optional)

```bash
npm run seed:admin
```

6. Seed a reusable non-production demo workspace (optional)

```bash
npm run seed:demo
```

7. Run backend

```bash
npm run dev
```

8. Run background jobs worker

```bash
npm run jobs:worker
```

The API can boot without the worker, but subscription expiry persistence and wearable audit retention cleanup are handled by the worker process.

After `npm run build`, the production worker entrypoint is:

```bash
npm run start:worker
```

## Critical Journey Smoke Check

Run the post-deploy smoke path for the highest-value flows:

```bash
npm run smoke:critical
```

The script will:

- verify API health and database reachability
- register a fresh member
- log in with a session cookie and validate `/me`
- create an onboarding subscription
- submit a member payment
- log in as admin and record a progress entry for the new member

For a local environment, `SMOKE_ADMIN_EMAIL` and `SMOKE_ADMIN_PASSWORD` can be omitted when `ADMIN_EMAIL` and `ADMIN_PASSWORD` are already configured.

## Demo Dataset

Use `npm run seed:demo` in non-production environments to reset and recreate a deterministic workspace with:

- one admin and one trainer
- four members spanning active, pending activation, ending-soon, and cancelled subscription states
- seeded payments, progress, trainer assignments, plans, and schedule bookings

The script is intentionally blocked when `NODE_ENV=production`.

## Dashboard Load Test

Baseline dashboard concurrency and compare against SLO thresholds:

```bash
npm run loadtest:dashboard:100
```

One-step authenticated run (uses `ADMIN_EMAIL` + `ADMIN_PASSWORD`, auto-logs in, uses session cookie):

```bash
npm run loadtest:dashboard:auth:100
```

Recommended environment variables before running:

- `LOADTEST_BEARER_TOKEN`: Admin JWT token for `/dashboard/admin/performance`
- `LOADTEST_SESSION_COOKIE`: Optional precomputed session cookie (e.g., `gms_session=...`)
- `LOADTEST_BASE_URL`: Target base URL (default `http://127.0.0.1:4000`)
- `LOADTEST_ENDPOINT`: Endpoint path (default `/dashboard/admin/performance`)
- `LOADTEST_ENFORCE_SLO`: Set `true` to exit non-zero when SLO is breached
- `LOADTEST_REPORT_PATH`: Optional output path for JSON report artifact

The admin performance payload now combines:

- request latency and 5xx-rate metrics
- dashboard cache hit/set/invalidation counters
- onboarding funnel counters (`member_registered`, onboarding subscription creation, onboarding payment submission)
- payment review outcome counters (`SUCCESS`, `FAILED`, reopened `PENDING`) plus a recent event sample for operator inspection

## Deployment Notes

- Same-origin deployment: leave `VITE_API_URL` empty on the client and proxy frontend requests to this API.
- Split frontend/backend deployment: set `CORS_ALLOWED_ORIGINS` to your deployed frontend URL(s).
- For cross-site auth cookies, set `COOKIE_SECURE=true` and `COOKIE_SAME_SITE=none`.
- Keep `TRAINER_INVITE_CODE` and `ADMIN_INVITE_CODE` empty in production unless self-registration is intentionally enabled.
- Follow the environment-specific release steps in `docs/DEPLOYMENT_CHECKLISTS.md`.

## Security Notes

- `helmet` enabled and `x-powered-by` disabled.
- Request body size cap enforced via `express.json` and `express.urlencoded`.
- Auth route rate limiting, login throttling visibility, and write-route rate limiting enabled.
- Input sanitization removes null bytes and trims params/query values.
- Error envelope is normalized (`{ error: { code, message, details? } }`).
- Password hashes are never returned by API responses.
- JWT errors (expired/invalid/missing) are normalized to safe 401 responses.

## Out of Scope (Intentional)

- Payments/Stripe/invoices
- Mobile app implementation
- AI recommendations
- Analytics/BI pipelines
- Real-time notifications

## API and Architecture Docs

- OpenAPI: `docs/openapi.yaml`
- Architecture summary: `docs/ARCHITECTURE.md`
- ERD (Mermaid): `docs/ERD.mmd`
- Database normalization notes (1NF/2NF/3NF): `docs/ARCHITECTURE.md#normalization-notes-1nf-2nf-3nf`
- User manual (IEEE style): `docs/USER_MANUAL_IEEE.md`
- User manual template: `docs/USER_MANUAL_TEMPLATE_IEEE.md`
- SRS supplement (IEEE oriented): `docs/SRS_SUPPLEMENT_IEEE.md`
- Operations runbook: `docs/OPS_RUNBOOK.md`
- Phase 4 release sign-off checklist: `docs/RELEASE_SIGNOFF_PHASE4.md`
- Deployment checklists: `docs/DEPLOYMENT_CHECKLISTS.md`
- Demo data strategy: `docs/DEMO_DATA_STRATEGY.md`
- Monitoring and alert recommendations: `docs/MONITORING_ALERTS.md`

## Gamification Endpoints

- `GET /me/achievements` (member): returns points and earned badge status
- `GET /users/:id/achievements` (admin/trainer): returns a member's badge summary with role checks

## Adaptive Recommendation Endpoints

- `GET /me/recommendations` (member): returns personalized BMI/trend-based workout + diet guidance
- `GET /users/:id/recommendations` (admin/trainer): returns recommendation snapshot for a member with role checks

## Wearable Sync Endpoint

- `POST /integrations/wearables/sync` (member): ingests Fitbit/Apple Watch/generic payload, normalizes metrics, and appends a progress entry
- `POST /integrations/wearables/webhook` (provider): server-to-server signed webhook ingestion (`x-wearable-provider`, `x-wearable-timestamp`, `x-wearable-signature`)
- `GET /dashboard/admin/integrations/wearables/audit` (admin): recent webhook audit snapshot (`windowMinutes` query, default 60, max 1440)
- `POST /dashboard/admin/integrations/wearables/audit/cleanup` (admin): manual retention cleanup (`retentionDays` query, default from env)

## Migration Notes

- The active migration history is PostgreSQL baseline in `prisma/migrations/20260307000000_postgres_baseline`.
- Legacy SQLite migrations are archived in `prisma/migrations_sqlite_legacy` for reference only.
