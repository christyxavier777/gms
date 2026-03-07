# Testing Strategy (System Testing)

## Unit Testing
- BMI formula and category mapping (`src/tests/bmi.unit.test.ts`)
- Edge-case rejection for unrealistic values (negative, NaN, zero-height)

## Integration Testing
- Request-shape validation for progress payloads (`src/tests/progress.integration.test.ts`)
- Next recommended additions: auth/session endpoints with supertest + test DB

## UAT Acceptance Criteria
1. Admin can create/cancel memberships; Trainer/Member cannot perform admin-only actions.
2. Progress entry with weight+height auto-computes BMI and auto-creates diet plan by category.
3. Login requires valid Gmail-format credentials and 10-digit phone at registration.
4. Session cookie is required for protected routes and logout revokes active session.

## Performance Baseline
- Target: 100 concurrent users without degradation.
- Recommended command once load tooling is installed: `k6 run load/k6-smoke.js`.
