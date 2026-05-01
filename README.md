# Kafil (كفيل) — Escrow & Community Arbitration for Arab Freelancers

Kafil is a production-ready fintech web experience that makes trust visible in the Arab freelance economy. It combines **milestone-based escrow**, **transparent project management**, and **community arbitration** with a premium, Apple-grade interface and bilingual RTL/LTR support.

## Table of Contents
- [Overview](#overview)
- [Why Kafil](#why-kafil)
- [Key Features](#key-features)
- [Product Tour (Roles)](#product-tour-roles)
- [Demo Accounts](#demo-accounts)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Scripts](#scripts)
- [Project Structure](#project-structure)
- [Data & Persistence](#data--persistence)
- [AI Arbitration Analyst](#ai-arbitration-analyst)
- [Deployment](#deployment)
- [Documentation](#documentation)
- [Security & Privacy](#security--privacy)
- [Contributing](#contributing)
- [License](#license)

## Overview
Kafil is built for clients, freelancers, coordinators, and community arbitrators. It demonstrates:
- A full **escrow lifecycle** from lock → milestone review → release.
- **Dispute resolution** with AI-assisted fairness analysis.
- **Role-based dashboards** with RTL-first Arabic UX.

## Why Kafil
- **Trust-first design**: escrow visibility is built into every workflow.
- **Community arbitration**: disputes are resolved by verified peers, not opaque admin decisions.
- **Localized experience**: Arabic-first UX with English toggle and typographic care.

## Key Features
- **Escrow ledger & money flow**: see locked vs. released funds per project.
- **Milestone-based task tracking** with invite/accept/submit flows.
- **Dispute center** with arbitration timelines and outcomes.
- **AI fairness analyst** (Gemini) with structured, explainable output.
- **Multi-role dashboards**: Admin, Client, Freelancer, Coordinator, Arbitrator.
- **Cinematic landing page** with GSAP + Framer Motion choreography.
- **Local-first demo data** using localStorage for instant, offline-ready evaluation.
- **Performance-ready** with lazy-loaded routes and Vite production build.

## Product Tour (Roles)
- **Client**: create projects, lock escrow, approve milestones, raise disputes.
- **Freelancer**: accept invites, deliver milestones, view payment timelines.
- **Coordinator**: manage teams, oversee delivery, participate in arbitration.
- **Admin**: platform-wide visibility and governance dashboards.
- **Arbitrator**: review cases, vote, and earn rewards for accurate decisions.

## Demo Accounts
Use the quick-select cards on the login screen to auto-fill demo access (recommended).  
Seeded demo emails:

| Role | Email |
| --- | --- |
| Admin | admin@kafeel.com |
| Client | client1@kafeel.com |
| Freelancer | freelancer1@kafeel.com |
| Coordinator | coordinator1@kafeel.com |

> Note: Demo data is seeded from `src/data/db.json`, which uses the `kafeel.com` domain.

## Tech Stack
- **Frontend**: React 19 + TypeScript
- **Build**: Vite 6
- **Styling**: Tailwind CSS 4 + Prettier
- **Data**: TanStack Query, localStorage-backed mock API
- **Motion**: Framer Motion, GSAP, Lenis
- **Icons**: Lucide
- **AI**: Google Gemini (`@google/genai`)

## Getting Started
```bash
npm install
npm run dev
```
Open the Vite dev server URL (default: http://localhost:5173).

## Environment Variables
Create a `.env` file (see `.env.example`):

```
VITE_GEMINI_API_KEY=your_api_key_here
VITE_API_URL=http://localhost:3000
```

`VITE_GEMINI_API_KEY` is optional. If omitted, the AI analyst returns a simulated arbitration response for demos.

## Scripts
| Command | Description |
| --- | --- |
| `npm run dev` | Start local dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Type check (tsc --noEmit) |
| `npm run clean` | Remove build output |

## Project Structure
```
src/
  features/   # Domain modules (auth, projects, escrow, dashboards)
  shared/     # Shared UI, hooks, utilities, translations
  layouts/    # App shell/layout wrappers
  pages/      # Route-level pages
  services/   # API + AI analyst service
  data/       # Seed data (db.json)
docs/         # Product, design, and architecture docs
public/       # Static assets and redirects
```

## Data & Persistence
Kafil runs fully in the browser using a **localStorage-backed mock API**.
- Initial data is seeded from `src/data/db.json`.
- State persists across reloads.
- Use the **Factory Reset** button on the login screen to restore default data.

## AI Arbitration Analyst
The arbitration engine lives in `src/services/aiAnalyst.ts`:
- Generates structured arbitration splits with confidence scores.
- Falls back to a safe simulated response when no API key is set.
- Designed for demo clarity and judge-friendly explainability.

## Deployment
Production-ready configs are included:
- **Vercel**: `vercel.json` for routing + caching.
- **Netlify**: `public/_redirects` for SPA routing.
- **VPS / Nginx**: `nginx.example.conf`.

Build command: `npm run build`  
Output directory: `dist`

## Documentation
- **Docs index**: `docs/README.md`
- **UI/UX spec**: `docs/design/ui-ux-spec.md`
- **Architecture ADR**: `docs/architecture/adr-001-feature-structure.md`
- **Business model**: `docs/BMC.md`
- **Pitch script**: `docs/script.md`

## Security & Privacy
- This project is a **front-end prototype**. No real payments are processed.
- All data stays in the browser unless a backend is added.
- Keep API keys in `.env` only; do not commit secrets.

## Contributing
Pull requests are welcome. Please run `npm run lint` before submitting changes.

## License
License not specified. Please contact the maintainers for usage permissions.
