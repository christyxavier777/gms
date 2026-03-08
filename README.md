## Project Overview
GMS (Gym Management System) is a full-stack monorepo with role-based operations for Admin, Trainer, and Member workflows, including subscriptions, plans, progress tracking, payments, recommendations, achievements, and wearable integrations.

## Repository Structure
```text
GMS/
+- client/   # React + Vite frontend
\- server/   # Node + Express + Prisma backend
```

## Current Delivery State
- Backend: PostgreSQL-based API with secure sessions, role enforcement, observability, webhook security/idempotency, and CI load-test gates.
- Frontend: landing + auth + role dashboards + onboarding/package flow with premium dashboard styling.
- Documentation: IEEE-style user manual, SRS supplement, ops runbook, and release sign-off checklist are available in `server/docs`.

## Quick Start
### Prerequisites
- Node.js 20+
- npm

### Install
```bash
cd client && npm install
cd ../server && npm install
```

### Run
```bash
cd server && npm run dev
cd ../client && npm run dev
```

## CI/CD
- Main CI validates server/client quality gates.
- Manual workflow-dispatch load-test gate is available for 100-concurrency sign-off with report artifacting.

## Primary Documentation
- Backend readme: `server/README.md`
- User manual: `server/docs/USER_MANUAL_IEEE.md`
- SRS supplement: `server/docs/SRS_SUPPLEMENT_IEEE.md`
- Ops runbook: `server/docs/OPS_RUNBOOK.md`
- Release sign-off: `server/docs/RELEASE_SIGNOFF_PHASE4.md`
