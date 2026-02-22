# Architecture Summary (Post-Core Freeze)

## High-Level Architecture

1. `src/index.ts` boots runtime and starts HTTP server.
2. `src/app.ts` composes global middleware and mounts route registry.
3. `src/routes/*` define API contracts.
4. `src/*/service.ts` enforce role/ownership checks and execute Prisma queries.
5. `src/prisma/client.ts` provides DB access through Prisma.

## Request Lifecycle

1. `helmet` and baseline app hardening.
2. request logger (`method`, `path`, status, duration).
3. JSON/urlencoded parsers with body size cap.
4. input sanitization on params/query/body.
5. auth rate limiter on `/auth`.
6. mutation rate limiter for non-GET routes.
7. route handler + zod validation + auth/role middleware.
8. service layer + Prisma query.
9. centralized error mapping to normalized envelope.

## Middleware Flow

`helmet -> requestLogger -> body parser(limit) -> sanitizeInput -> auth limiter -> mutation limiter -> routes -> notFound -> errorHandler`

## Role Enforcement Strategy

- `requireAuth` validates bearer JWT and attaches `req.auth`.
- `requireRole(...roles)` enforces route-level role gates.
- Service layer applies ownership checks (plan ownership, self-access, assignment checks).

## Subscription Lifecycle Logic

- `ACTIVE` created by admin for members.
- Stale active subscriptions auto-transition to `EXPIRED` on read paths.
- Explicit cancel transitions to `CANCELLED`.
- Overlapping active subscription windows are blocked.

## Progress Tracking Rules

- Write: ADMIN/TRAINER.
- Target must be MEMBER.
- Trainer must be assignment-linked to member through created assigned plans.
- Append-only entries (no update endpoint).
- Delete reserved for ADMIN correction.
- Reads ordered by `recordedAt DESC`.

## ERD

Mermaid ERD source is in `docs/ERD.mmd`.
