# Operations Runbook

## 1. Environment Bootstrapping
1. Install dependencies:
   - `npm install` in `server`
2. Configure `.env` from `.env.example`.
3. Validate Prisma schema:
   - `npm run prisma:generate`
   - `npm run prisma:migrate:deploy`
4. Seed admin:
   - `npm run seed:admin`
5. Seed a non-production demo workspace when needed:
   - `npm run seed:demo`
6. Start service:
   - `npm run dev` (or `npm run build && npm run start`)
7. Start worker when running background jobs separately:
   - `npm run jobs:worker`

## 2. Core Health Checks
- HTTP health:
  - `GET /health`
- Auth health:
  - login and `/me` validation with session cookie
- Critical user journeys:
  - `npm run smoke:critical`
- DB migration status:
  - `npm run prisma:migrate:status`

## 3. CI Pipeline Expectations
### 3.1 Standard CI (`push` / `pull_request`)
- Server: install, Prisma generate/deploy, typecheck, tests, build
- Client: install, typecheck, lint, build

### 3.2 Manual Load-Test CI
- Trigger `workflow_dispatch` with `run_loadtest=true`
- CI will:
  - bootstrap DB and Redis
  - seed admin
  - start server
  - run authenticated 100-concurrency dashboard load test
  - validate SLOs
  - publish report artifact

## 4. SLO and Performance Operations
- Local load test:
  - `npm run loadtest:dashboard:auth:100`
- SLO controls:
  - `SLO_LATENCY_P95_MS`
  - `SLO_ERROR_RATE_PCT`
- Report output:
  - `LOADTEST_REPORT_PATH`
- Monitoring/alert reference:
  - `docs/MONITORING_ALERTS.md`

## 5. Wearable Webhook Operations
### 5.1 Required Headers
- `x-wearable-provider`: `FITBIT | APPLE_WATCH | GENERIC`
- `x-wearable-timestamp`: Unix epoch seconds
- `x-wearable-signature`: `sha256=<hmac>`
- `x-wearable-event-id`: unique provider event identifier

### 5.2 Signature Setup
- Configure provider secrets:
  - `WEARABLE_WEBHOOK_SECRET_FITBIT`
  - `WEARABLE_WEBHOOK_SECRET_APPLE_WATCH`
  - `WEARABLE_WEBHOOK_SECRET_GENERIC`

### 5.3 Failure Modes
- `401 WEBHOOK_SIGNATURE_*`: bad signature/timestamp
- `409 DUPLICATE_WEBHOOK_EVENT`: duplicate or in-flight event
- DB unavailable: audit persistence falls back to memory snapshot source

## 6. Audit Operations
### 6.1 Inspect Audit Snapshot
- `GET /dashboard/admin/integrations/wearables/audit?windowMinutes=60`

### 6.2 Manual Cleanup
- `POST /dashboard/admin/integrations/wearables/audit/cleanup?retentionDays=30`

### 6.3 Scheduled Cleanup
- Controlled by:
  - `WEARABLE_AUDIT_RETENTION_DAYS`
  - `WEARABLE_AUDIT_CLEANUP_INTERVAL_MS`

## 7. Incident Response (Quick Path)
1. Capture `requestId`, endpoint, timestamp.
2. For webhook incidents also capture provider + event ID.
3. Check:
   - app logs
   - `/dashboard/admin/performance`
   - `/dashboard/admin/integrations/wearables/audit`
   - `docs/MONITORING_ALERTS.md`
4. If DB is degraded, verify fallback source and restore DB connectivity.
5. Reprocess failed webhook events only with original event IDs and valid signatures.

## 8. Backup and Recovery (Database)
### 8.1 Recommended Minimum
- Daily logical backup of PostgreSQL.
- Weekly restore drill in staging.

### 8.2 Restore Validation
1. Restore DB.
2. Run `npm run prisma:migrate:status`.
3. Verify auth login, dashboards, and key role flows with `npm run smoke:critical`.
4. Verify wearable audit query endpoint returns expected shape.

## 9. Related Operational Docs
- Deployment checklists: `docs/DEPLOYMENT_CHECKLISTS.md`
- Demo data strategy: `docs/DEMO_DATA_STRATEGY.md`
- Monitoring and alert recommendations: `docs/MONITORING_ALERTS.md`
