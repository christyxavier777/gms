# SRS Supplement (IEEE-Oriented)

## 1. Purpose
This supplement captures post-core enhancements and formalizes requirements implemented after baseline architecture freeze.

## 2. Scope Additions
- PostgreSQL migration baseline and CI alignment
- Redis-backed caching and distributed rate-limiting support
- SLO observability and contract tests
- Load test tooling and CI artifact publication
- Achievements, adaptive recommendations, and wearable integrations
- Signed webhook ingestion with idempotency and audit persistence

## 3. Functional Requirements
### FR-01 Role Security
System shall enforce role-specific access for all dashboard and management modules.

### FR-02 BMI Intelligence
System shall compute BMI from progress inputs and classify into diet categories.

### FR-03 Recommendation Generation
System shall generate personalized recommendations using latest/previous BMI, activity consistency, and membership signals.

### FR-04 Gamification
System shall compute badge and points summaries for members based on measurable activity metrics.

### FR-05 Wearable Sync
System shall accept wearable payloads, normalize metrics, and append validated progress entries.

### FR-06 Signed Webhook Ingestion
System shall verify provider webhook signatures with HMAC SHA-256 and timestamp tolerance.

### FR-07 Webhook Idempotency
System shall reject duplicate/in-flight webhook events using provider-scoped event IDs.

### FR-08 Audit Visibility
System shall expose admin-only wearable audit metrics snapshots over configurable windows.

### FR-09 Audit Durability
System shall persist wearable audit events in PostgreSQL with fallback to in-memory aggregation when DB is unavailable.

### FR-10 Audit Retention
System shall support scheduled and manual cleanup of retained audit rows.

## 4. Non-Functional Requirements
### NFR-01 Performance
- Backend target: sustain 100 concurrent requests for dashboard workloads.
- Load-test scripts shall emit machine-readable reports.

### NFR-02 Reliability
- Audit subsystem shall fail fast to memory fallback when DB latency/unavailability exceeds configured threshold.

### NFR-03 Security
- Bcrypt password hashing, secure sessions, normalized auth errors.
- HMAC signature verification and strict idempotency for integration webhooks.

### NFR-04 Observability
- SLO metrics: p95 latency and 5xx error rate.
- Cache hit/miss tracking and admin inspection endpoint.

## 5. Data Model Additions
- `WearableWebhookAuditEvent` table with provider/status enums and metadata fields.
- Indexed columns for time-window queries and provider/status filtering.

## 6. Interfaces
- Admin observability endpoints:
  - `/dashboard/admin/performance`
  - `/dashboard/admin/integrations/wearables/audit`
  - `/dashboard/admin/integrations/wearables/audit/cleanup`
- Integration endpoints:
  - `/integrations/wearables/sync`
  - `/integrations/wearables/webhook`

## 7. Constraints and Assumptions
- Session-cookie auth remains primary mechanism.
- Test mode may operate without live Postgres; audit metrics will fallback to memory.
- CI load-test gate is manual trigger (`workflow_dispatch`) to control execution cost.

## 8. Verification Mapping
- Unit tests: BMI, achievements, recommendation engine, cache idempotency, webhook signature, webhook metrics.
- Contract tests: admin observability/audit endpoint access and payload shape.
- CI validates typecheck, lint (client), tests, build, migrations, and optional load-test sign-off.
