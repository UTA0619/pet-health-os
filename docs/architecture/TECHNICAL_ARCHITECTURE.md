# Technical Architecture — Pet Health OS

## System Overview

Pet Health OS is a multi-tenant, AI-native application built on a serverless-first architecture. All AI processing happens server-side (Supabase Edge Functions or Next.js API Routes). The client receives results via REST or Supabase Realtime.

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                            │
│   Next.js 15 (Web)          React Native / Expo (Mobile)        │
│   App Router, RSC           iOS 16+ / Android 12+               │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS / WSS
┌────────────────────────────▼────────────────────────────────────┐
│                        EDGE LAYER                               │
│   Vercel Edge Network (CDN)                                     │
│   Next.js Middleware (auth validation, rate limiting)           │
│   Vercel Cron (scheduled AI jobs)                               │
└──────────────┬─────────────────────────┬────────────────────────┘
               │                         │
┌──────────────▼────────┐    ┌───────────▼────────────────────────┐
│    SUPABASE PLATFORM  │    │         NEXT.JS API ROUTES          │
│                       │    │                                     │
│   Auth (JWT, OAuth)   │    │   /api/v1/pets                      │
│   PostgreSQL (RLS)    │    │   /api/v1/health-logs               │
│   Realtime (WSS)      │    │   /api/webhooks/stripe              │
│   Edge Functions:     │    │   /api/cron/*                       │
│   - analyze-pet-image │    │   /api/health                       │
│   - generate-score    │    └───────────┬────────────────────────┘
│   - run-anomaly       │                │
│   - send-alerts       │    ┌───────────▼────────────────────────┐
│   - sync-baselines    │    │         EXTERNAL SERVICES           │
└──────────────┬────────┘    │                                     │
               │             │   OpenAI (GPT-4o Vision, mini,      │
               │             │           text-embedding-3-large)   │
               │             │   Cloudflare R2 (image storage)     │
               │             │   Stripe (payments)                 │
               │             │   OneSignal (push notifications)    │
               │             │   Resend (email)                    │
               │             │   Upstash Redis (rate limit/cache)  │
               │             │   Sentry (errors)                   │
               │             │   PostHog (analytics)               │
               │             └────────────────────────────────────┘
               │
┌──────────────▼────────────────────────────────────────────────┐
│                      DATA LAYER                                │
│   PostgreSQL (Supabase)                                        │
│   ├── profiles, pets, pet_photos, pet_weight_history          │
│   ├── health_logs, symptom_reports, vet_visits                │
│   ├── health_scores, anomaly_detections, camera_analyses      │
│   ├── pet_baselines (per-pet statistical models)              │
│   └── subscriptions, billing_events, notification_preferences │
│                                                                │
│   Cloudflare R2 (pet images — CDN-served)                     │
└───────────────────────────────────────────────────────────────┘
```

## Data Flow: Health Log → AI Score

```
User submits health log
    │
    ▼
Next.js API Route /api/v1/health-logs (POST)
    │  Validate JWT + Zod schema
    │  Insert into health_logs
    │
    ▼
Supabase DB Webhook → generate-health-score Edge Function
    │  Fetch last 30 logs
    │  Compute weighted composite score
    │  Generate explanation (GPT-4o-mini)
    │  Upsert to health_scores
    │
    ▼
Supabase Realtime broadcast → Client updates score card
    │
    ▼
run-anomaly-detection (async, every 30 min via Vercel Cron)
    │  Compare today's log vs pet_baselines (Z-score + IQR)
    │  Insert anomaly_detection if threshold exceeded
    │
    ▼
send-health-alerts Edge Function
    │  Fetch owner's OneSignal player_id
    │  Send push notification
    │  Mark anomaly as alert_sent
```

## Data Flow: Camera Analysis

```
User captures photo
    │
    ▼
Client: request presigned R2 upload URL from /api/v1/upload-url
    │
    ▼
Client: upload image directly to R2 (bypasses Next.js, no bandwidth cost)
    │
    ▼
Client: POST /api/v1/analyze (with pet_id + r2_url)
    │
    ▼
Next.js API Route proxies to analyze-pet-image Edge Function
    │  Verify ownership
    │  Rate limit check
    │  GPT-4o Vision call (15s timeout)
    │  Store findings in camera_analyses
    │  If concerning → trigger anomaly check
    │
    ▼
Return analysis + disclaimer to client
```

## Key Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Database | Supabase Postgres | RLS, Realtime, Edge Functions — all in one platform |
| AI | OpenAI GPT-4o | Best vision model; structured outputs; reliable |
| Image storage | Cloudflare R2 | Zero egress fees; global CDN; presigned uploads |
| Auth | Supabase Auth | Apple Sign-In support; JWT RS256; OAuth PKCE |
| Notifications | OneSignal | iOS + Android + web in one SDK |
| Rate limiting | Upstash Redis | Edge-compatible; sliding window; per-user |
| Monorepo | Turborepo | Shared packages; parallel builds; cache |
| Payments | Stripe | Industry standard; webhook reliability |

## Security Architecture

- **RLS on every table** — users physically cannot access other users' data
- **Service role isolated** — only Edge Functions receive service role key, never the client
- **JWT validated** on every request in Next.js middleware
- **Rate limits** on all AI endpoints (Upstash Redis)
- **XML isolation** of user content in all prompts
- **Medical guardrails** — no diagnoses, disclaimer on all AI outputs
- **Presigned URLs** for image upload — client never touches R2 credentials

## Scalability

| Scale Point | Current | Solution at 10K users |
|---|---|---|
| DB connections | Supabase pooler | PgBouncer (built-in) |
| AI throughput | Sequential | Job queue (pg-boss) |
| Image delivery | R2 + CDN | Same — R2 has no limits |
| Cron jobs | Vercel Cron | Same — serverless |
| Edge Functions | Cold starts | Keep-alive ping every 5min |
