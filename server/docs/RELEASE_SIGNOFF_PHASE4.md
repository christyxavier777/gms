# Phase 4 Release Sign-Off

## 1. Scope Covered
- Frontend onboarding/package selection UX upgrade
- Dashboard visual system refresh (Admin/Trainer/Member)
- Documentation and operational handover package
- Performance/security release gates and CI artifacting

## 2. Preconditions
- PostgreSQL and Redis reachable in target environment
- Prisma migrations deployed successfully
- Admin seed user configured with a valid email and known credentials
- Secrets configured (JWT + webhook HMAC secrets)

## 3. Verification Checklist
### 3.1 Build and Static Quality
- [ ] `server`: typecheck + tests + build pass
- [ ] `client`: typecheck + lint + build pass

### 3.2 Runtime Validation
- [ ] `/health` returns `200`
- [ ] Login and `/me` session flow works
- [ ] Role dashboards load by role
- [ ] Register flow (2-step onboarding) works and preselects package in subscriptions
- [ ] `npm run smoke:critical` completes against the target environment

### 3.3 Security Controls
- [ ] Bcrypt hashing active for registration seed/login accounts
- [ ] Session revocation works on logout
- [ ] Role checks enforced on protected endpoints
- [ ] Webhook signature and idempotency controls active

### 3.4 Observability and Audit
- [ ] `/dashboard/admin/performance` returns metrics/slo/cache
- [ ] `/dashboard/admin/integrations/wearables/audit` returns snapshot
- [ ] Audit source indicates `database` when DB healthy
- [ ] Manual cleanup endpoint executes successfully

### 3.5 Load and SLO
- [ ] Run manual CI load test (`workflow_dispatch`, `run_loadtest=true`)
- [ ] Confirm p95 latency and error-rate within configured thresholds
- [ ] Load-test artifact retained and reviewed

## 4. Rollback Plan
1. Revert application deployment to previous tagged release.
2. Restore database from latest verified backup if schema/data issue exists.
3. Re-run health/auth/dashboard smoke checks.
4. Disable webhook ingestion temporarily if integration path is unstable.

## 5. Go/No-Go Criteria
### Go
- All checklist items pass.
- No P1/P2 open defects.
- Performance and security gates pass.

### No-Go
- Authentication/session regression
- Migration failure
- Webhook security/idempotency bypass
- SLO breach without accepted waiver

## 6. Sign-Off Records
- Product Owner: __________________ Date: __________
- Engineering Lead: ______________ Date: __________
- QA Lead: _______________________ Date: __________
- Operations: _____________________ Date: __________
