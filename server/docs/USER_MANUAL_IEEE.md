# User Manual (IEEE-Style)

## 1. Introduction
### 1.1 Purpose
This manual defines how Administrators, Trainers, and Members operate the Gym Management System (GMS) web application in production.

### 1.2 Scope
Covered modules:
- Authentication and session management
- Dashboard operations by role
- Plans, subscriptions, progress tracking
- Payments (UPI flow)
- Achievements, recommendations, and wearable integrations

### 1.3 Audience
- System Administrators
- Trainers
- Members
- Operations/Support staff

## 2. System Access
### 2.1 Supported Clients
- Modern Chromium-based browsers
- Firefox (latest)
- Safari (latest)

### 2.2 Login
1. Open `/login`.
2. Enter a registered email address and password.
3. Submit.
4. On success, a secure session cookie is issued and role-based dashboard is loaded.

### 2.3 Logout
1. Use Logout control in navigation.
2. Session is revoked server-side.

## 3. Role-Based Workflows
### 3.1 Administrator
- View Admin dashboard KPIs and performance/audit insights.
- Manage users and statuses.
- Create and assign workout/diet plans.
- Create and cancel subscriptions.
- View platform-wide progress, payments, and webhook audit cleanup controls.

### 3.2 Trainer
- Access Trainer dashboard and assigned-member progress.
- Create plans and view member outcomes within assignment boundaries.
- View member achievements/recommendations where assignment grants access.

### 3.3 Member
- Access Member dashboard and personal plans/progress.
- View achievements and adaptive recommendations.
- Sync wearable metrics via authenticated sync endpoint.

## 4. Onboarding (Member)
1. Open `/register`.
2. Complete the profile fields: name, email, phone, password, and role.
3. Select a membership package and continue through the guided activation flow.
4. Confirm subscription and submit payment details.
5. Review the final activation status and next steps screen.

## 5. Functional Modules
### 5.1 Plans
- Workout and diet plans can be created and assigned according to role permissions.

### 5.2 Subscriptions
- Admin creates subscription with plan and date range.
- Overlapping active subscriptions are blocked.
- Expiry auto-transition and explicit cancellation supported.

### 5.3 Progress
- Admin/Trainer can create progress entries.
- BMI is auto-computed when weight and height are provided.
- Diet category and recommendation logic are linked to recorded BMI.

### 5.4 Payments
- Payment records include unique transaction IDs.
- Status management supports operational verification.

### 5.5 Achievements and Recommendations
- Members can view points/badges and recommendation snapshots.
- Admin/Trainer access is permission-bound.

### 5.6 Wearable Integration
- Member sync endpoint for direct app-based upload.
- Signed webhook endpoint for provider/server-to-server ingestion.
- HMAC signature, timestamp tolerance, and idempotency enforcement are active.

## 6. Error Handling and Recovery
- Validation errors return structured response with details.
- Authentication/authorization errors return normalized safe codes/messages.
- Duplicate webhook events return conflict and are safely ignored.

## 7. Security Notes
- Password hashing uses bcrypt.
- Session cookie is HttpOnly with server-side revocation.
- Role checks are enforced in route + service layers.
- Rate limits applied for auth, mutations, and wearable sync.

## 8. Troubleshooting
- `401`: verify active session/login.
- `403`: verify role or ownership/assignment permissions.
- `409` on webhook: duplicate event ID already processed/in-flight.
- Webhook signature failures: verify provider secret, timestamp, and signing base format.

## 9. Support Escalation
Operational incidents should include:
- `requestId`
- endpoint path
- role and user ID (if authenticated)
- webhook provider/event ID (integration incidents)
