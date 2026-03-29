# Table Descriptions

This version is written in a report-style format to match the reference layout.

Note:
- The live Prisma/PostgreSQL schema uses camelCase field names such as `createdById` and `updatedAt`.
- In this document, those fields are presented in snake_case style such as `created_by_id` and `updated_at` for academic/report consistency.
- The table descriptions below still represent the current project schema.

## 1. Users Table

| Column name | Data Type | Constraints | Description |
| --- | --- | --- | --- |
| `id` | `UUID (string)` | PRIMARY KEY, NOT NULL | Unique user ID |
| `name` | `varchar` | NOT NULL | Full name of the user |
| `email` | `varchar` | UNIQUE, NOT NULL | User email address |
| `phone` | `varchar` | UNIQUE, NOT NULL | User phone number |
| `password_hash` | `text` | NOT NULL | Encrypted password value used for login |
| `role` | `enum` | NOT NULL, DEFAULT `MEMBER` | Role of the user: admin, trainer, or member |
| `status` | `enum` | NOT NULL, DEFAULT `ACTIVE` | Current account status |
| `created_at` | `datetime` | NOT NULL, DEFAULT `CURRENT_TIMESTAMP` | Record creation time |
| `updated_at` | `datetime` | NOT NULL, AUTO-UPDATED | Last update time |

## 2. Membership_Plans Table

| Column name | Data Type | Constraints | Description |
| --- | --- | --- | --- |
| `id` | `varchar` | PRIMARY KEY, NOT NULL | Unique membership plan ID |
| `name` | `varchar` | NOT NULL | Membership plan name |
| `price_minor` | `integer` | NOT NULL | Membership price stored in minor units |
| `duration_days` | `integer` | NOT NULL | Duration of the plan in days |
| `perks` | `text` | NOT NULL | Benefits included in the plan |
| `active` | `boolean` | NOT NULL, DEFAULT `true` | Whether the plan is currently available |
| `display_order` | `integer` | NOT NULL, DEFAULT `100` | Display order used in the plan catalog |
| `created_at` | `datetime` | NOT NULL, DEFAULT `CURRENT_TIMESTAMP` | Record creation time |
| `updated_at` | `datetime` | NOT NULL, AUTO-UPDATED | Last update time |

## 3. Subscriptions Table

| Column name | Data Type | Constraints | Description |
| --- | --- | --- | --- |
| `id` | `UUID (string)` | PRIMARY KEY, NOT NULL | Unique subscription ID |
| `user_id` | `UUID (string)` | FOREIGN KEY -> `users.id`, NOT NULL | Member who owns the subscription |
| `plan_id` | `varchar` | FOREIGN KEY -> `membership_plans.id`, NOT NULL | Membership plan linked to the subscription |
| `plan_name` | `varchar` | NOT NULL | Stored plan name snapshot |
| `start_date` | `datetime` | NOT NULL | Subscription start date |
| `end_date` | `datetime` | NOT NULL | Subscription expiry date |
| `status` | `enum` | NOT NULL, DEFAULT `ACTIVE` | Current subscription lifecycle status |
| `created_at` | `datetime` | NOT NULL, DEFAULT `CURRENT_TIMESTAMP` | Record creation time |
| `updated_at` | `datetime` | NOT NULL, AUTO-UPDATED | Last update time |

## 4. Payments Table

| Column name | Data Type | Constraints | Description |
| --- | --- | --- | --- |
| `id` | `UUID (string)` | PRIMARY KEY, NOT NULL | Unique payment ID |
| `transaction_id` | `varchar` | UNIQUE, NOT NULL | Unique transaction reference |
| `user_id` | `UUID (string)` | FOREIGN KEY -> `users.id`, NOT NULL | User who submitted the payment |
| `subscription_id` | `UUID (string)` | FOREIGN KEY -> `subscriptions.id`, NULL | Subscription related to the payment |
| `amount_minor` | `integer` | NOT NULL | Payment amount in minor currency units |
| `upi_id` | `varchar` | NOT NULL | UPI handle used for payment |
| `proof_reference` | `text` | NULL | Optional payment proof reference |
| `status` | `enum` | NOT NULL, DEFAULT `PENDING` | Payment verification status |
| `reviewed_by_id` | `UUID (string)` | FOREIGN KEY -> `users.id`, NULL | Admin who reviewed the payment |
| `reviewed_at` | `datetime` | NULL | Review timestamp |
| `verification_notes` | `text` | NULL | Notes added during payment verification |
| `created_at` | `datetime` | NOT NULL, DEFAULT `CURRENT_TIMESTAMP` | Record creation time |
| `updated_at` | `datetime` | NOT NULL, AUTO-UPDATED | Last update time |

## 5. Progress Table

| Column name | Data Type | Constraints | Description |
| --- | --- | --- | --- |
| `id` | `UUID (string)` | PRIMARY KEY, NOT NULL | Unique progress entry ID |
| `user_id` | `UUID (string)` | FOREIGN KEY -> `users.id`, NOT NULL | Member whose fitness progress is tracked |
| `recorded_by_id` | `UUID (string)` | FOREIGN KEY -> `users.id`, NOT NULL | Admin or trainer who recorded the entry |
| `weight` | `decimal` | NULL | Recorded body weight |
| `height` | `decimal` | NULL | Recorded height |
| `body_fat` | `decimal` | NULL | Recorded body fat percentage |
| `bmi` | `decimal` | NULL | Body mass index value |
| `diet_category` | `enum` | NULL | Fitness or diet category derived from measurements |
| `notes` | `text` | NULL | Additional progress remarks |
| `recorded_at` | `datetime` | NOT NULL | Date and time of the recorded measurement |
| `created_at` | `datetime` | NOT NULL, DEFAULT `CURRENT_TIMESTAMP` | Record creation time |
| `updated_at` | `datetime` | NOT NULL, AUTO-UPDATED | Last update time |

## 6. Workout_Plans Table

| Column name | Data Type | Constraints | Description |
| --- | --- | --- | --- |
| `id` | `UUID (string)` | PRIMARY KEY, NOT NULL | Unique workout plan ID |
| `title` | `varchar` | NOT NULL | Workout plan title |
| `description` | `text` | NOT NULL | Workout details |
| `created_by_id` | `UUID (string)` | FOREIGN KEY -> `users.id`, NOT NULL | Admin/trainer who created plan |
| `assigned_to_id` | `UUID (string)` | FOREIGN KEY -> `users.id`, NULL | Member assigned to the plan |
| `created_at` | `datetime` | NOT NULL, DEFAULT `CURRENT_TIMESTAMP` | Creation time |
| `updated_at` | `datetime` | NOT NULL, AUTO-UPDATED | Last update time |

## 7. Diet_Plans Table

| Column name | Data Type | Constraints | Description |
| --- | --- | --- | --- |
| `id` | `UUID (string)` | PRIMARY KEY, NOT NULL | Unique diet plan ID |
| `title` | `varchar` | NOT NULL | Diet plan title |
| `description` | `text` | NOT NULL | Diet plan details |
| `created_by_id` | `UUID (string)` | FOREIGN KEY -> `users.id`, NOT NULL | Admin/trainer who created plan |
| `assigned_to_id` | `UUID (string)` | FOREIGN KEY -> `users.id`, NULL | Member assigned to the diet plan |
| `created_at` | `datetime` | NOT NULL, DEFAULT `CURRENT_TIMESTAMP` | Creation time |
| `updated_at` | `datetime` | NOT NULL, AUTO-UPDATED | Last update time |
