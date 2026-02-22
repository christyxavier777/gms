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
- Database: SQLite (local dev via `DATABASE_URL=file:./dev.db`)
- Auth: JWT + bcrypt
- Validation: Zod
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
| `JWT_SECRET` | Yes | - | JWT signing secret |
| `JWT_EXPIRES_IN` | Yes | - | JWT TTL (example: `1d`) |
| `ADMIN_NAME` | Yes | - | Seed admin display name |
| `ADMIN_EMAIL` | Yes | - | Seed admin email |
| `ADMIN_PASSWORD` | Yes | - | Seed admin password |
| `JSON_BODY_LIMIT` | No | `100kb` | Global JSON/urlencoded request size cap |
| `AUTH_RATE_LIMIT_WINDOW_MS` | No | `900000` | Auth limiter window |
| `AUTH_RATE_LIMIT_MAX` | No | `20` | Max auth requests/window |
| `MUTATION_RATE_LIMIT_WINDOW_MS` | No | `60000` | Mutation limiter window |
| `MUTATION_RATE_LIMIT_MAX` | No | `120` | Max write requests/window |

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
npm run prisma:migrate
npm run prisma:migrate:phase2
npm run prisma:migrate:phase3
npm run prisma:migrate:phase4
npm run prisma:migrate:phase5
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
