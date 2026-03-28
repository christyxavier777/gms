# GMS Product Improvement Roadmap

## Delivery Status

- Overall roadmap status: complete
- Completed improvement items: 51 / 51
- Remaining unchecked items: 0
- Last updated: 2026-03-28

### Section Completion

- User Experience (Frontend): 17 / 17 complete
- System Integrity (Backend): 20 / 20 complete
- Performance / Scalability: 14 / 14 complete

### How To Read This File

- Everything marked `[x]` with strikethrough has been delivered.
- The audit notes below are the original baseline findings that motivated the work.
- The checklist sections are the source of truth for delivery progress.

---

## Original Audit Snapshot

### Original User Journey Friction

- Member onboarding is visually strong, but the flow is fragmented: registration, package selection, subscription creation, and payment confirmation are split across separate screens and do not complete as one guided journey.
- Several workflows still expose internal IDs to users and staff instead of searchable names. Trainers currently type member UUIDs in places like progress creation and plan assignment, which is not professional-grade.
- The member experience has gaps after account creation. A member can finish registration without a clearly activated membership, payment confirmation, or first-day checklist.
- Payment handling is usable for demo/admin workflows, but it lacks proof upload, verification notes, reconciliation cues, and a clearer ledger narrative for members.
- Protected route redirects and loading states are functional but sparse, which creates abrupt transitions and weak recovery when auth or API requests fail.
- The product talks about a full gym system, but there is no class scheduling / booking journey yet. This is a notable product capability gap relative to typical gym software expectations.

### Original Technical Bottlenecks

- Authentication is still constrained by a hardcoded `@gmail.com` policy, which is too restrictive for a real product.
- Payment amounts use floating-point storage and free-form transaction generation, which is risky for accounting accuracy and operational reconciliation.
- Subscription plans are duplicated as free-text `planName` values in the database and a separate frontend catalog, which invites drift.
- Dashboard and list endpoints are still heavily page-load oriented, with limited filtering, search, and pagination for operational use at larger scale.
- Role and ownership rules are thoughtful, but several business flows are still coupled tightly to current data shape rather than explicit product concepts like membership lifecycle, billing state, or scheduling capacity.
- Frontend server-state management is mostly local `useState` / `useEffect`, which will become increasingly brittle as the app grows.
- Operational observability exists, but there is still room for stronger audit trails, richer admin tooling, and clearer production diagnostics.

---

## User Experience (Frontend)

### 1. Onboarding to Active Membership
Goal: turn registration into a complete, confidence-building activation flow instead of a partial handoff.

- [x] ~~Redesign the member onboarding flow so registration, package selection, subscription setup, and payment submission feel like one continuous journey.~~
- [x] ~~Add a final success state that clearly tells the member what was created, what is pending, and what to do next.~~
- [x] ~~Show package duration, billing summary, and membership status in the onboarding confirmation.~~
- [x] ~~Add password visibility toggle, password strength feedback, and inline validation hints on register/login screens.~~
- [x] ~~Add recovery affordances for failed onboarding actions, including retry actions and clearer error phrasing.~~

### 2. Staff-Friendly Operational Flows
Goal: remove internal-system friction for admins and trainers.

- [x] ~~Replace raw member UUID entry fields with searchable member selectors across plans, subscriptions, and progress workflows.~~
- [x] ~~Add member summaries beside selection controls so staff can confirm they picked the right person.~~
- [x] ~~Improve admin payment review with filters, quick actions, and clearer status context.~~
- [x] ~~Add trainer-focused empty states that explain how to get assigned members, plans, and progress into the system.~~

### 3. Navigation, Accessibility, and Usability Polish
Goal: make the app feel professional across desktop, mobile, and keyboard-driven use.

- [x] ~~Consolidate top navigation and dashboard navigation behavior so route access feels consistent.~~
- [x] ~~Add loading skeletons or placeholder states for auth boot and major page fetches.~~
- [x] ~~Improve protected-route redirects so unauthorized users land on helpful pages instead of abrupt home redirects.~~
- [x] ~~Run an accessibility pass on form labels, focus visibility, semantic grouping, and screen-reader friendly validation messaging.~~
- [x] ~~Add form success/error banners with consistent tone and layout across pages.~~

### 4. Product Capability Gap: Scheduling
Goal: close the gap between "gym management system" messaging and the actual feature set.

- [x] ~~Design a first-pass class / session scheduling experience for members, trainers, and admins.~~
- [x] ~~Define key frontend views for timetable, booking, trainer availability, and attendance history.~~
- [x] ~~Add navigation entry points for scheduling without overwhelming current users.~~

---

## System Integrity (Backend)

### 1. Authentication and Identity Hardening
Goal: make auth rules production-safe and less artificially restrictive.

- [x] ~~Remove the hardcoded Gmail-only restriction and replace it with standards-based email validation.~~
- [x] ~~Strengthen password validation rules server-side and align frontend messaging with those rules.~~
- [x] ~~Add login throttling visibility and clearer auth error taxonomy for lockout-like situations.~~
- [x] ~~Add session management improvements such as revoke-all-sessions or device/session visibility.~~

### 2. Payment and Billing Integrity
Goal: make payment records trustworthy enough for real operations.

- [x] ~~Replace floating-point payment storage with integer minor units (for example, paise/cents).~~
- [x] ~~Add structured payment review metadata such as reviewer, reviewedAt, and optional verification notes.~~
- [x] ~~Add immutable payment event/audit history for status transitions.~~
- [x] ~~Add optional payment proof reference support (image URL or attachment metadata).~~
- [x] ~~Tighten transaction/reference generation so payment records are easier to reconcile.~~

### 3. Subscription and Plan Domain Modeling
Goal: reduce domain drift and make membership logic easier to evolve.

- [x] ~~Introduce a canonical subscription plan catalog table in the backend instead of relying on free-text `planName`.~~
- [x] ~~Link subscriptions to plans by ID and derive duration/price from server-owned data.~~
- [x] ~~Align the frontend plan catalog with the backend source of truth.~~
- [x] ~~Expand subscription state modeling to support more explicit lifecycle stages if needed (for example pending activation, cancelled-at-period-end).~~

### 4. Data Validation and API Consistency
Goal: make the API more predictable and safer to extend.

- [x] ~~Review all route payload schemas for missing constraints, especially text lengths and enum transitions.~~
- [x] ~~Add explicit filtering/sorting query contracts for payments, subscriptions, users, and progress endpoints.~~
- [x] ~~Standardize list responses so pagination/search/filter patterns are consistent across domains.~~
- [x] ~~Add clearer domain errors where business rules fail, especially for onboarding, payments, and trainer/member ownership checks.~~

### 5. Scheduling Domain Foundation
Goal: prepare the backend for real scheduling capabilities.

- [x] ~~Define scheduling entities such as class/session, trainer availability, booking, and attendance.~~
- [x] ~~Design role-aware APIs for creating sessions, booking members, cancelling bookings, and marking attendance.~~
- [x] ~~Add validation and authorization rules for scheduling operations.~~

---

## Performance / Scalability

### 1. Query Efficiency and Data Access
Goal: keep dashboards and operational lists responsive as data volume grows.

- [x] ~~Review Prisma queries used by dashboards and lists for opportunities to reduce round trips and over-fetching.~~
- [x] ~~Add or validate database indexes for common filters and sort paths in payments, subscriptions, progress, sessions, and dashboard reads.~~
- [x] ~~Add server-side pagination for any remaining high-volume list endpoints that currently default to broad fetches.~~
- [x] ~~Introduce search support for users/members so staff workflows do not depend on loading large datasets client-side.~~

### 2. Frontend State Management and Data Fetching
Goal: make UI data flows more resilient and scalable.

- [x] ~~Introduce a dedicated server-state layer (for example, React Query/TanStack Query or an equivalent pattern).~~
- [x] ~~Centralize loading, retry, cache invalidation, and optimistic update behavior for CRUD-heavy screens.~~
- [x] ~~Normalize repeated API error handling patterns into reusable UI primitives.~~

### 3. Background Work and Operational Scaling
Goal: move time-based or burst-sensitive work out of request paths where appropriate.

- [x] ~~Review automatic subscription expiry, wearable audit retention, and similar recurring tasks for extraction into explicit jobs/workers.~~
- [x] ~~Add structured health/readiness checks for external dependencies such as PostgreSQL and Redis.~~
- [x] ~~Expand observability for high-value admin flows, including payment review and onboarding completion funnel tracking.~~

### 4. Production Readiness and Delivery
Goal: make releases safer and easier to operate.

- [x] ~~Add environment-specific deployment checklists for frontend and backend release steps.~~
- [x] ~~Add smoke-test coverage for the critical user journeys: register, login, subscription creation, payment submission, progress logging.~~
- [x] ~~Add seed/demo data strategy that is separate from production behavior.~~
- [x] ~~Add monitoring/alert recommendations for API health, auth failures, and background job failures.~~

---

## Suggested Execution Order

1. [x] ~~Remove Gmail-only auth restriction and strengthen auth validation.~~
2. [x] ~~Replace raw UUID-based staff workflows with searchable member selectors.~~
3. [x] ~~Unify onboarding, subscription activation, and payment confirmation flow.~~
4. [x] ~~Normalize payment storage and add payment review audit metadata.~~
5. [x] ~~Introduce backend-owned subscription plan catalog and align frontend plan data.~~
6. [x] ~~Add search/filter/pagination across users, subscriptions, payments, and progress.~~
7. [x] ~~Introduce dedicated frontend server-state management.~~
8. [x] ~~Design and implement scheduling domain foundation.~~

---

## Maintenance Notes

- For future roadmap additions, use an unchecked box for planned work and a checked box plus strikethrough for delivered work.
- Keep historical audit notes intact unless the baseline itself needs correction.
- Add new work items incrementally and keep them grouped by product area.
