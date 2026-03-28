# Deployment Checklists

## Backend

### Pre-Deploy
- [ ] Confirm target environment variables are set: `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CORS_ALLOWED_ORIGINS`, cookie settings, worker intervals, and webhook secrets when used.
- [ ] Run `npm install`, `npm run typecheck`, `npm test`, and `npm run build` in `server`.
- [ ] Verify Prisma state with `npm run prisma:migrate:status`.
- [ ] Confirm admin access credentials are known for smoke validation.

### Deploy
- [ ] Run `npm run prisma:migrate:deploy`.
- [ ] Start or restart the API process.
- [ ] Start or restart the background worker with `npm run start:worker` when using a separate worker process.
- [ ] Verify `GET /health/live` returns `200`.
- [ ] Verify `GET /health` or `GET /health/ready` reports database readiness.

### Post-Deploy
- [ ] Run `npm run smoke:critical` against the deployed base URL.
- [ ] Check `/dashboard/admin/performance` for SLO and business-flow visibility.
- [ ] Review worker logs for `job_worker_started` and recent `subscription_expiry_job` activity.
- [ ] If Redis is configured, confirm cache health is `up`; if not, confirm fallback mode is expected.

## Frontend

### Pre-Deploy
- [ ] Confirm `VITE_API_URL` is correct for same-origin or split deployment.
- [ ] Run `npm install`, `npm run typecheck`, `npm run lint`, and `npm run build` in `client`.
- [ ] Verify login, register, and protected route handling against the target API.

### Deploy
- [ ] Publish the latest client build artifact.
- [ ] Confirm API proxy or CORS configuration matches the deployment topology.
- [ ] For cross-site cookies, verify `COOKIE_SECURE=true` and `COOKIE_SAME_SITE=none` on the backend.

### Post-Deploy
- [ ] Load the landing page, login page, and register flow in the deployed frontend.
- [ ] Complete one member login and one admin login from the browser.
- [ ] Validate dashboard navigation, payments, subscriptions, progress, and schedule entry points.
- [ ] Re-run the backend smoke script after the frontend is live if the deployment changed auth/session behavior.

## Rollback Triggers

- Smoke script fails on registration, login, subscription onboarding, payment submission, or progress logging.
- Health checks lose database readiness.
- Admin performance dashboard shows sustained SLO breach or elevated 5xx rate.
- Worker startup or recurring job execution logs disappear after release.
