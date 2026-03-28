# Monitoring and Alert Recommendations

## API Health

- Alert when `GET /health` or `GET /health/ready` fails twice in a row.
- Alert when database dependency status is not `up`.
- Alert when cache status is `down` in environments where Redis is expected.
- Track p95 latency and 5xx rate from `/dashboard/admin/performance` against:
  - `SLO_LATENCY_P95_MS`
  - `SLO_ERROR_RATE_PCT`

## Authentication

- Alert on sustained spikes of `AUTH_LOGIN_THROTTLED` responses.
- Alert on unusual growth in `INVALID_CREDENTIALS` or `ACCOUNT_INACTIVE` errors, especially after deployment.
- Watch session-related failures on `/me`, `/me/sessions`, and logout/revoke flows after cookie or CORS changes.

## Background Jobs

- Alert when the worker does not emit `job_worker_started` at deploy/startup.
- Alert when `subscription_expiry_job_failed` appears in logs.
- Alert when expected recurring job logs stop appearing for longer than one worker interval.
- Alert when wearable cleanup logs or retention behavior disappear unexpectedly in environments that process webhook traffic.

## Business and Operator Signals

- Review onboarding funnel metrics in `/dashboard/admin/performance` after each deployment.
- Watch for growth in pending payments without corresponding review activity.
- Watch for repeated payment review failures or unusually high reopened `PENDING` volumes.

## Recommended Initial Thresholds

- Health/readiness failure: 2 consecutive checks.
- p95 latency breach: above `SLO_LATENCY_P95_MS` for 10 minutes.
- 5xx rate breach: above `SLO_ERROR_RATE_PCT` for 5 minutes.
- Login throttling spike: more than 3x the recent daily baseline.
- Worker silence: no recurring job log activity for 2 expected intervals.
