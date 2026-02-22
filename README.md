## Project Overview
GMS (Gym Management System) is a full-stack application for managing core gym operations in a structured way, with a dedicated backend for business logic and data handling, and a frontend for user-facing experiences; the current active objective is to establish and iterate on a production-ready landing page while keeping the backend stable.

## Architecture Overview
This repository is a monorepo with two top-level applications: `/client` (frontend) and `/server` (backend). The client is responsible for presentation and UI delivery, while the server owns API behavior, authentication, persistence, and domain logic. This separation keeps development boundaries clear while allowing shared version control and coordinated releases.

## Tech Stack
- Frontend: React, Vite, Tailwind CSS
- Backend: Node.js, TypeScript, Express
- ORM: Prisma
- Database: PostgreSQL (SQLite for local)
- Auth: JWT

## Folder Structure
```text
GMS/
+- client/   # Frontend application (active workstream: landing page UI)
\- server/   # Backend application (API, auth, database, domain logic)
```

## Backend Status
The backend is complete and frozen at **v1.0.0**.
Implemented backend phases are complete at a high level, including core service setup, API layer stabilization, data layer integration, and authentication support.
No new backend features are in scope for the current workstream.

## Frontend Status
The landing page is the only active frontend scope.
Application UI beyond landing (including auth screens and dashboards) is deferred.

## Setup Instructions
### Prerequisites
- Node.js (LTS recommended)
- npm
- Git

### Clone Repository
```bash
git clone <repo-url>
cd GMS
```

### Install Dependencies
Install client and server dependencies separately:
```bash
cd client
npm install
cd ../server
npm install
```

### Environment Variables
At this stage, no sensitive secrets are required for the landing-page-focused frontend work.
Use local environment files only as needed by each app's existing configuration.

## Development Workflow
Run each app independently in separate terminals.

### Run Client
```bash
cd client
npm run dev
```

### Run Server
```bash
cd server
npm run dev
```

No CI/CD assumptions are required for local development in this repository.

## Versioning & History
Client and server histories are preserved via **git subtree** in this monorepo.
This keeps component-level commit lineage intact, supports reliable rollback, and preserves git history integrity across both applications.

## Out of Scope
- Payments
- Mobile apps
- Notifications
- Advanced analytics
- AI features

## License / Usage Note
License and usage terms are not defined in this document yet.
Add the project's official license text and usage policy before external distribution.
