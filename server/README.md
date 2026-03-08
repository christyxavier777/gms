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
| `ADMIN_NAME` | Yes | - | Seed admin display name |
| `ADMIN_EMAIL` | Yes | - | Seed admin email (must be valid `@gmail.com`) |
| `ADMIN_PASSWORD` | Yes | - | Seed admin password |
| `JSON_BODY_LIMIT` | No | `100kb` | Global JSON/urlencoded request size cap |
| `AUTH_RATE_LIMIT_WINDOW_MS` | No | `900000` | Auth limiter window |
| `AUTH_RATE_LIMIT_MAX` | No | `20` | Max auth requests/window |
| `MUTATION_RATE_LIMIT_WINDOW_MS` | No | `60000` | Mutation limiter window |
| `MUTATION_RATE_LIMIT_MAX` | No | `120` | Max write requests/window |
| `WEARABLE_SYNC_RATE_LIMIT_WINDOW_MS` | No | `60000` | Wearable sync limiter window |
| `WEARABLE_SYNC_RATE_LIMIT_MAX` | No | `30` | Max wearable sync requests/window |

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

5. Seed admin user

```bash
npm run seed:admin
```

6. Run backend

```bash
npm run dev
```

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

## Security Notes

- `helmet` enabled and `x-powered-by` disabled.
- Request body size cap enforced via `express.json` and `express.urlencoded`.
- Auth route rate limiting and write-route rate limiting enabled.
- Input sanitization removes null bytes and trims params/query values.
- Error envelope is normalized (`{ error: { code, message, details? } }`).
- Password hashes are never returned by API responses.
- JWT errors (expired/invalid/missing) are normalized to safe 401 responses.

## Out of Scope (Intentional)

- Payments/Stripe/invoices
- Mobile app implementation
- AI recommendations
- Analytics/BI pipelines
- Background schedulers/cron jobs
- Real-time notifications

## API and Architecture Docs

- OpenAPI: `docs/openapi.yaml`
- Architecture summary: `docs/ARCHITECTURE.md`
- ERD (Mermaid): `docs/ERD.mmd`
- Database normalization notes (1NF/2NF/3NF): `docs/ARCHITECTURE.md#normalization-notes-1nf-2nf-3nf`

## Gamification Endpoints

- `GET /me/achievements` (member): returns points and earned badge status
- `GET /users/:id/achievements` (admin/trainer): returns a member's badge summary with role checks

## Adaptive Recommendation Endpoints

- `GET /me/recommendations` (member): returns personalized BMI/trend-based workout + diet guidance
- `GET /users/:id/recommendations` (admin/trainer): returns recommendation snapshot for a member with role checks

## Wearable Sync Endpoint

- `POST /integrations/wearables/sync` (member): ingests Fitbit/Apple Watch/generic payload, normalizes metrics, and appends a progress entry

## Migration Notes

- The active migration history is PostgreSQL baseline in `prisma/migrations/20260307000000_postgres_baseline`.
- Legacy SQLite migrations are archived in `prisma/migrations_sqlite_legacy` for reference only.
