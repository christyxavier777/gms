# Testing Strategy

## Automated Coverage Layers

### Unit and Contract Coverage
- Schema and validation hardening across auth, subscriptions, payments, progress, and list queries in `src/tests/*.unit.test.ts`
- Route-level contract checks for auth, plans, payments, progress, schedule, subscriptions, dashboard, and health in `src/tests/*.contract.test.ts`
- Focus area: role enforcement, request-shape validation, pagination/filter contracts, and domain-specific error envelopes

### Integration Coverage
- Progress integration coverage in `src/tests/progress.integration.test.ts`
- Dashboard performance gate coverage in `src/tests/dashboard-performance.contract.test.ts`

## Critical User Journey Smoke Coverage

Run `npm run smoke:critical` against a running environment to cover the highest-value path:

1. Health verification with database reachability.
2. Member registration.
3. Member login plus `/me` session validation.
4. Onboarding subscription creation.
5. Member payment submission.
6. Admin-authenticated progress logging for the newly created member.

Required configuration:

- `SMOKE_BASE_URL`
- `SMOKE_ADMIN_EMAIL` and `SMOKE_ADMIN_PASSWORD`

Defaults:

- `SMOKE_ADMIN_EMAIL` and `SMOKE_ADMIN_PASSWORD` fall back to `ADMIN_EMAIL` and `ADMIN_PASSWORD`
- `SMOKE_MEMBER_PASSWORD` defaults to `SmokeTest123`
- `SMOKE_UPI_ID` defaults to `smoke.member@okaxis`

## UAT Acceptance Criteria

1. Admin-only actions remain restricted to admin users, and member/trainer scopes are enforced consistently.
2. Registration accepts standards-based valid emails, a 10-digit phone, and strong passwords.
3. Session-backed auth works across login, `/me`, logout, and session-revocation paths.
4. Member onboarding can progress from account creation to subscription and payment submission without manual data fixes.
5. Admin or trainer staff can record member progress with persisted retrieval afterward.

## Performance Baseline

- Target: 100 concurrent users without degradation.
- Recommended command: `npm run loadtest:dashboard:auth:100`.
- Optional CI/manual release gate: authenticated dashboard load test plus report artifact review.
