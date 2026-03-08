# Gym Management System (Client)

## Project Overview

This repository contains the client-side application for the Gym Management System.

The client includes public pages, authentication views, role-based dashboards, and onboarding flows connected to the backend API.

## Scope (Current)

Included areas:
- Public landing experience (Header, Hero, Features, CTA, Footer)
- Authentication and registration flow
- Two-step member onboarding with package preselection handoff to subscriptions
- Role-based dashboards and operational pages (plans, subscriptions, progress)

Current implementation focus:
- Responsive layouts across mobile, tablet, and desktop
- Accessible UI patterns (semantic structure, readable contrast, keyboard-friendly interactions)
- Integration with backend authentication/session and domain endpoints

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

`VITE_API_URL` can be used to override API base URL (defaults to `http://localhost:4000`).

## Out of Scope (Explicit)

- Payments
- Analytics
- Mobile applications

## Future Work

- UI/UX refinement of dashboard and onboarding micro-interactions
- End-to-end frontend test coverage
- Release-ready style/token documentation
