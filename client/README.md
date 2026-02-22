# Gym Management System (Client)

## Project Overview

This repository contains the client-side application for the Gym Management System.

The current client is responsible for presenting a public-facing landing experience, including marketing content and onboarding-focused user interface sections.

Backend responsibilities such as business logic, data persistence, authentication, and APIs are handled in a separate backend repository and are intentionally out of scope here.

## Scope (Current)

At this stage, the frontend scope is limited to a landing page experience.

Included sections:
- Header
- Hero
- Features
- Call-to-Action (CTA)
- Footer

Current implementation focus:
- Responsive layouts across mobile, tablet, and desktop
- Accessible UI patterns (semantic structure, readable contrast, keyboard-friendly interactions)
- No data fetching and no backend integration

## Tech Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- npm (package management and scripts)

## Folder Structure

```text
src/
  components/   # Reusable UI building blocks (layout, sections, shared UI pieces)
  pages/        # Page-level composition (landing page and route-level views)
  styles/       # Global styles, Tailwind layer extensions, and design tokens
  assets/       # Static assets (images, icons, brand media)
  main.tsx      # App bootstrap and React root mounting
  App.tsx       # Top-level app composition
```

## Setup Instructions

### Prerequisites

- Node.js (LTS recommended, version 18+)
- npm (comes with Node.js)

### Install Dependencies

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

### Build for Production

```bash
npm run build
```

### Preview Production Build (Optional)

```bash
npm run preview
```

## Design and UI Principles

- Mobile-first implementation to ensure strong small-screen usability
- Accessibility-first choices for semantics, keyboard usage, and readable interfaces
- Design token usage for consistent spacing, typography, and color behavior
- Component-driven UI to keep sections reusable, maintainable, and testable

## Environment Variables

No environment variables are required at this stage.

## Out of Scope (Explicit)

- Authentication
- Dashboards
- Backend integration
- Payments
- Analytics
- Mobile applications

## Future Work

- Integrate with backend services
- Add authentication flows
- Build user dashboards by role
- Introduce subscription-related views
