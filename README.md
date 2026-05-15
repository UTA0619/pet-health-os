# 🐾 Pet Health OS

> **AI-native predictive pet health operating system.** Detects abnormalities early, predicts risks before symptoms appear, and delivers daily health intelligence to pet owners — powered by GPT-4o Vision and real-time behavior modeling.

[![CI](https://github.com/moji-inc/pet-health-os/actions/workflows/ci.yml/badge.svg)](https://github.com/moji-inc/pet-health-os/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue.svg)](tsconfig.json)

---

## What It Does

| Capability | Description |
|---|---|
| **Daily Health Score** | 0–100 composite score from 6 behavioral metrics, computed daily |
| **Camera Health Scanner** | GPT-4o Vision analyzes coat, eyes, posture, mobility from a photo |
| **Anomaly Detection** | Statistical baseline modeling catches deviations 48–72h before symptoms |
| **Predictive Alerts** | Push alerts when a pet's trend line crosses risk thresholds |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend (Web) | Next.js 15 (App Router), TypeScript strict, Tailwind CSS, Framer Motion |
| Frontend (Mobile) | React Native + Expo, Reanimated 3 |
| Backend | Supabase Edge Functions (Deno), Next.js API Routes |
| Database | PostgreSQL (Supabase) + pgvector for semantic search |
| AI | OpenAI GPT-4o (vision), GPT-4o-mini (text), text-embedding-3-large |
| Image Storage | Cloudflare R2 |
| Payments | Stripe (web) + RevenueCat (mobile IAP) |
| Auth | Supabase Auth — Google, Apple, Email/Password |
| Notifications | OneSignal (push), Resend (email) |
| Observability | Sentry, PostHog, Vercel Observability |
| CI/CD | GitHub Actions + Vercel |
| Monorepo | Turborepo |

---

## Repository Structure

```
pet-health-os/
├── apps/
│   ├── web/                    # Next.js 15 web application
│   └── mobile/                 # React Native / Expo application
├── packages/
│   ├── ai/                     # Health score, anomaly detection, baseline modeling
│   ├── database/               # Supabase client, generated types, query helpers
│   ├── ui/                     # Shared component library
│   └── config/                 # Shared tsconfig, eslint, prettier configs
├── supabase/
│   ├── functions/              # Edge Functions (analyze-pet-image, generate-health-score, ...)
│   └── migrations/             # Versioned PostgreSQL migrations
├── docs/                       # Architecture, product, operations documentation
├── scripts/                    # GitHub setup automation, seed scripts
├── infra/                      # Terraform, Docker configs
└── .github/                    # CI/CD workflows, issue templates, PR template
```

---

## Quick Start

### Prerequisites
- Node.js 20+
- pnpm 9+
- Supabase CLI
- Vercel CLI

### Setup

```bash
# 1. Clone and install
git clone https://github.com/moji-inc/pet-health-os.git
cd pet-health-os
pnpm install

# 2. Configure environment
cp .env.example .env.local
# Fill in your Supabase, OpenAI, Stripe, etc. credentials

# 3. Start Supabase locally
supabase start
supabase db push

# 4. Start development
pnpm dev
```

### First-time GitHub setup (new contributors)

```bash
# Creates all labels, milestones, and project board
bash scripts/setup-github.sh

# Seeds all 55 issues (requires gh CLI authenticated)
bash scripts/seed-issues.sh
```

---

## GitHub Project Board

**Board:** [Pet Health OS — Engineering](https://github.com/orgs/moji-inc/projects/1)

| Column | Description |
|---|---|
| Icebox | Not yet prioritized |
| Backlog | Prioritized, not sprint-planned |
| Ready | Sprint-planned, all dependencies met |
| In Progress | Actively being worked (WIP limit: 3) |
| In Review | PR open, awaiting review |
| QA | Merged to staging, awaiting sign-off |
| Done | Shipped to production |

---

## Milestones

| Milestone | Timeline | Goal |
|---|---|---|
| M0: Foundation | Days 1–3 | Auth, DB schema, CI/CD, staging |
| M1: MVP Week 1 | Days 1–7 | Core logging, AI score, camera scan |
| M2: MVP Week 2 | Days 8–14 | Anomaly detection, subscriptions, notifications |
| M3: Closed Beta | Month 2 | 100 users, NPS >40, performance hardened |
| M4: Public Launch | Month 3 | App Store, marketing site, viral loop |
| M5: AI Optimization | Month 4+ | Model accuracy >85%, vet integration |

---

## Documentation

| Doc | Description |
|---|---|
| [Technical Architecture](docs/architecture/TECHNICAL_ARCHITECTURE.md) | System design, component map, data flow |
| [AI System](docs/architecture/AI_SYSTEM.md) | Scoring algorithm, anomaly detection, camera pipeline |
| [Database Schema](docs/architecture/DATABASE_SCHEMA.md) | Full PostgreSQL schema with RLS policies |
| [API Reference](docs/architecture/API_REFERENCE.md) | REST API v1 — all endpoints |
| [Sprint Roadmap](docs/project/SPRINT_ROADMAP.md) | Sprint-by-sprint delivery plan |
| [PRD](docs/product/PRD.md) | Product requirements and user stories |
| [Deployment](docs/operations/DEPLOYMENT.md) | Deploy procedures, rollback, smoke tests |
| [Incident Response](docs/operations/INCIDENT_RESPONSE.md) | On-call runbook |
| [Contributing](CONTRIBUTING.md) | Engineering standards, PR process |
| [Security](SECURITY.md) | Vulnerability reporting, security architecture |

---

## Performance Budgets

| Metric | Target |
|---|---|
| First Contentful Paint | < 1.5s |
| AI score generation | < 3s P95 |
| Camera analysis | < 8s P95 |
| API P99 latency | < 200ms |
| Anomaly detection | < 1 min from log submission |

---

## License

MIT © 2025 Moji Inc.
