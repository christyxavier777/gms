# Demo Data Strategy

## Goal

Provide a deterministic non-production dataset for demos, QA walkthroughs, and operator training without mixing those personas into production seeding.

## Commands

- `npm run seed:admin`
  - Minimal operational bootstrap.
  - Intended for creating or updating a single admin account.
- `npm run seed:demo`
  - Non-production only.
  - Resets known demo personas and rebuilds a richer workspace.

## What `seed:demo` Creates

- 1 admin and 1 trainer
- 4 members with distinct subscription lifecycle states:
  - active
  - pending activation
  - cancelled at period end
  - cancelled
- trainer-member assignments
- workout and diet plans
- payments in pending, success, and failed states with review history
- progress entries
- schedule sessions and bookings

## Safety Guardrails

- The script refuses to run when `NODE_ENV=production`.
- It only resets users matching the deterministic demo email list.
- Production bootstrap remains isolated in `seed:admin`.

## Configuration

- `DEMO_EMAIL_DOMAIN`
- `DEMO_ADMIN_PASSWORD`
- `DEMO_TRAINER_PASSWORD`
- `DEMO_MEMBER_PASSWORD`

## Recommended Usage

1. Run migrations with `npm run prisma:migrate:deploy`.
2. Run `npm run seed:demo`.
3. Use the seeded credentials and member records for walkthroughs or QA.
4. Re-run `npm run seed:demo` whenever a clean deterministic state is needed.
