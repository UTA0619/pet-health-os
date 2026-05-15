#!/usr/bin/env bash
# ============================================================
# Pet Health OS — GitHub Issues Seeder (55 issues)
# Usage: bash scripts/seed-issues.sh [owner/repo]
# Requires: gh CLI authenticated, labels + milestones created first
# ============================================================

set -euo pipefail

REPO="${1:-$(gh repo view --json nameWithOwner -q .nameWithOwner)}"
echo "Seeding 55 issues into: $REPO"
echo "This will take ~2 min due to GitHub API rate limits."

# Helper
create_issue() {
  local title="$1" body="$2" labels="$3" milestone="$4"
  gh issue create \
    --repo "$REPO" \
    --title "$title" \
    --body "$body" \
    --label "$labels" \
    --milestone "$milestone" \
    --assignee "@me" 2>/dev/null || echo "  ⚠ Issue '$title' failed — may already exist"
  sleep 0.5  # Respect GitHub API rate limits
}

# ── DATABASE ISSUES ─────────────────────────────────────────

create_issue \
  "[DB] Design and implement initial PostgreSQL schema with pgvector" \
  "## Objective
Enable pgvector, uuid-ossp, pg_trgm, pgcrypto. Create profiles table with RLS. Implement updated_at trigger.

## Acceptance Criteria
- [ ] Supabase local runs migration cleanly
- [ ] Generated types pass TypeScript strict
- [ ] RLS blocks cross-user access (integration test)
- [ ] updated_at trigger fires on profile update

## Dependencies
None — this is first.

**Estimated:** 3h | **Difficulty:** S" \
  "database,P0: Critical,sprint-1,mvp,task" \
  "M0: Foundation"

create_issue \
  "[DB] Create pets table with CRUD API and RLS policies" \
  "## Objective
Create pets table (owner_id FK, name, species, breed, dob, weight_kg, sex, photo_url, microchip_id, is_active). Supabase Edge Function for CRUD. Zod input validation.

## Acceptance Criteria
- [ ] CRUD operations work via API
- [ ] RLS: user can only see own pets
- [ ] Weight history tracked via trigger
- [ ] Integration test: user A cannot read user B's pets

**Estimated:** 4h | **Difficulty:** S" \
  "database,backend,P0: Critical,sprint-1,mvp,task" \
  "M1: MVP Week 1"

create_issue \
  "[DB] Implement health_logs time-series table with indexes" \
  "## Objective
Create health_logs table with 6 metric columns (1-5 scale). Composite index on (pet_id, log_date). Unique constraint: one log per pet per day.

## Acceptance Criteria
- [ ] Unique constraint (pet_id, log_date) enforced
- [ ] Query for last 30 days returns in <50ms
- [ ] Full-text index on notes field
- [ ] Backfill test data for 90 days

**Estimated:** 3h | **Difficulty:** S" \
  "database,P1: High,sprint-1,mvp,task" \
  "M1: MVP Week 1"

create_issue \
  "[DB] Build AI engine tables (health_scores, anomaly_detections, camera_analyses, pet_baselines)" \
  "## Objective
Four tables with RLS, service-role-only writes, JSONB for flexible AI output storage. Vector index for semantic search.

## Acceptance Criteria
- [ ] All 4 tables created with correct RLS
- [ ] Service role write policies enforced
- [ ] Indexes present on all FK + date columns
- [ ] JSONB columns store structured AI outputs

**Estimated:** 5h | **Difficulty:** M" \
  "database,ai,P0: Critical,sprint-1,mvp,task" \
  "M1: MVP Week 1"

create_issue \
  "[DB] Add database indexing strategy and query performance benchmarks" \
  "## Objective
Add composite indexes on all FK+date fields. EXPLAIN ANALYZE on top 10 query patterns. Target: all indexed queries <100ms at 10K pets.

## Acceptance Criteria
- [ ] All performance-critical queries show Index Scan (not Seq Scan)
- [ ] Query plan analysis documented
- [ ] pg_stat_statements enabled

**Estimated:** 3h | **Difficulty:** S" \
  "database,performance,P2: Medium,sprint-2,task" \
  "M2: MVP Week 2"

create_issue \
  "[DB] Implement database backup strategy and PITR" \
  "## Objective
Supabase PITR enabled. Daily pg_dump to Cloudflare R2. Recovery runbook documented.

## Acceptance Criteria
- [ ] Daily backup completes and is verified
- [ ] Restore test completes in <30 min
- [ ] Runbook in docs/operations/

**Estimated:** 4h | **Difficulty:** S" \
  "database,infra,security,P1: High,sprint-2,task" \
  "M2: MVP Week 2"

# ── AUTH ISSUES ────────────────────────────────────────────

create_issue \
  "[AUTH] Implement Supabase Auth with Google, Apple SSO, and email/password" \
  "## Objective
Google OAuth (web + mobile). Apple Sign-In (required for iOS App Store). Email/password with verification. JWT RS256. Session persistence.

## Acceptance Criteria
- [ ] All 3 auth methods work on web
- [ ] Apple Sign-In works on iOS
- [ ] JWT validated in Edge Functions
- [ ] Session persists across app restarts

**Estimated:** 6h | **Difficulty:** M" \
  "auth,backend,P0: Critical,sprint-1,mvp,task" \
  "M1: MVP Week 1"

create_issue \
  "[AUTH] Build auth middleware and route protection" \
  "## Objective
Next.js middleware validates Supabase JWT on all /api/* routes. Public routes whitelist. 401 vs 403 distinction.

## Acceptance Criteria
- [ ] Unauthenticated requests → 401
- [ ] Cross-user data access → 403 (RLS)
- [ ] Middleware adds <5ms latency
- [ ] Public routes: /api/health unaffected

**Estimated:** 4h | **Difficulty:** S" \
  "auth,security,backend,P0: Critical,sprint-1,mvp,task" \
  "M1: MVP Week 1"

create_issue \
  "[AUTH] Implement rate limiting on auth endpoints (brute force protection)" \
  "## Objective
Upstash Redis sliding window. 5 login attempts per 15 min per IP. 3 password resets per hour. Return 429 with Retry-After header.

## Acceptance Criteria
- [ ] 6th login attempt within window → 429
- [ ] Rate limit metrics in PostHog
- [ ] No false positives on normal usage

**Estimated:** 3h | **Difficulty:** S" \
  "auth,security,backend,P1: High,sprint-2,task" \
  "M2: MVP Week 2"

create_issue \
  "[AUTH] Add GDPR-compliant account deletion with data purge pipeline" \
  "## Objective
Soft delete + 30-day hard delete queue. Cascade: pets → health_logs → AI outputs → R2 images. Stripe subscription cancellation. Audit log.

## Acceptance Criteria
- [ ] Account deleted in <2 clicks
- [ ] All data purged within 30 days
- [ ] Stripe subscription cancelled
- [ ] Anonymized deletion record retained

**Estimated:** 5h | **Difficulty:** M" \
  "auth,security,backend,P2: Medium,sprint-3,beta,task" \
  "M3: Closed Beta"

# ── AI ISSUES ─────────────────────────────────────────────

create_issue \
  "[AI] Build pet health score algorithm (weighted composite scoring)" \
  "## Objective
Weighted composite score from 6 metrics (1-5 scale) → 0-100. Trend direction via linear regression on 7-day window. Confidence decreases with missing data.

## Acceptance Criteria
- [ ] Score generated in <200ms (pure computation)
- [ ] Explanation is human-readable
- [ ] Score decreases on symptom degradation
- [ ] Confidence <50% when <3 days data

**Estimated:** 8h | **Difficulty:** L" \
  "ai,backend,P0: Critical,sprint-1,mvp,task" \
  "M1: MVP Week 1"

create_issue \
  "[AI] Implement GPT-4o Vision camera analysis pipeline" \
  "## Objective
Image upload to R2. Pre-processing: resize 1024px, JPEG 85%, EXIF strip. GPT-4o Vision with JSON schema output. Retry logic (3x exponential backoff). Human review flag at confidence <0.4.

## Acceptance Criteria
- [ ] Analysis completes in <8s P95
- [ ] Structured JSON always returned
- [ ] Confidence score present
- [ ] High-severity findings trigger anomaly check
- [ ] Medical disclaimer appended

**Estimated:** 10h | **Difficulty:** XL" \
  "ai,camera,backend,P0: Critical,sprint-1,mvp,task" \
  "M1: MVP Week 1"

create_issue \
  "[AI] Build per-pet baseline behavior modeling (rolling 30-day statistics)" \
  "## Objective
Per-pet, per-metric rolling statistics: mean, std_dev, Q1, Q3, min, max (30-day window). Recomputed weekly via cron. Cold start: population norms until 14 days of data.

## Acceptance Criteria
- [ ] Baselines computed for all active pets
- [ ] Cold start norms loaded from static JSON
- [ ] Baselines update within 24h of cron run
- [ ] sample_count tracked correctly

**Estimated:** 6h | **Difficulty:** M" \
  "ai,backend,P1: High,sprint-2,mvp,task" \
  "M2: MVP Week 2"

create_issue \
  "[AI] Implement statistical anomaly detection (Z-score + IQR)" \
  "## Objective
Z-score: |metric - mean| / std > 2.5σ. IQR: value outside [Q1-1.5IQR, Q3+1.5IQR]. Severity: mild (one method), moderate (both), severe (>3.5σ). Alert deduplication within 24h.

## Acceptance Criteria
- [ ] Anomaly detected when single metric deviates 2.5σ
- [ ] SEVERE detected in <1 min of log submission
- [ ] Zero duplicate alerts within 24h window
- [ ] False positive rate <15% on test dataset

**Estimated:** 8h | **Difficulty:** L" \
  "ai,backend,P0: Critical,sprint-2,mvp,task" \
  "M2: MVP Week 2"

create_issue \
  "[AI] Build AI explainability layer for health scores" \
  "## Objective
GPT-4o-mini generates 1-sentence explanation for each metric below 70/100. Cache per (pet_id, score_date). Warm tone, no medical diagnoses.

## Acceptance Criteria
- [ ] Every score card shows explanation
- [ ] Explanation mentions pet name
- [ ] No medical diagnoses in output
- [ ] Cache works correctly

**Estimated:** 5h | **Difficulty:** M" \
  "ai,frontend,P1: High,sprint-2,mvp,task" \
  "M2: MVP Week 2"

create_issue \
  "[AI] Add confidence scoring and uncertainty quantification" \
  "## Objective
Composite confidence from: data completeness, baseline maturity, model confidence. UI shows confidence indicator. Low confidence (<0.5) suppresses push alerts.

## Acceptance Criteria
- [ ] Confidence on all AI outputs
- [ ] Correlated with data completeness
- [ ] Alerts suppressed below threshold
- [ ] Confidence logged for eval

**Estimated:** 4h | **Difficulty:** S" \
  "ai,P2: Medium,sprint-2,task" \
  "M2: MVP Week 2"

create_issue \
  "[AI] Implement AI guardrails and medical disclaimer system" \
  "## Objective
Output filter blocks diagnosis-related strings. Disclaimer appended to all health outputs. Rate limit camera analysis: 3/day (free), 50/day (pro). Human review queue.

## Acceptance Criteria
- [ ] Filtered strings never appear in UI
- [ ] Disclaimer always visible
- [ ] Rate limits enforced
- [ ] 0 medical diagnoses in production (verified via eval)

**Estimated:** 5h | **Difficulty:** M" \
  "ai,security,P0: Critical,sprint-2,mvp,task" \
  "M2: MVP Week 2"

create_issue \
  "[AI] Create AI evaluation pipeline and ground truth dataset" \
  "## Objective
50-case ground truth dataset. Automated eval script in CI: precision, recall, MAE. PR comment with results. Block merge if regression >5%.

## Acceptance Criteria
- [ ] Eval runs in CI in <5 min
- [ ] PR comment shows before/after metrics
- [ ] Merge blocked on regression
- [ ] Dataset version-controlled

**Estimated:** 8h | **Difficulty:** L" \
  "ai,P1: High,sprint-3,beta,task" \
  "M3: Closed Beta"

create_issue \
  "[AI] Implement prompt versioning and A/B testing framework" \
  "## Objective
Prompts as versioned TypeScript constants. Prompt version logged with every call. Feature flag controls active version. Eval pipeline auto-promotes if new version wins.

## Acceptance Criteria
- [ ] Every AI call logs prompt version
- [ ] Rollback via feature flag in <5 min
- [ ] A/B experiment shows statistical significance before promotion

**Estimated:** 6h | **Difficulty:** M" \
  "ai,P2: Medium,sprint-3,task" \
  "M3: Closed Beta"

create_issue \
  "[AI] Build Edge Function: generate-health-score (DB webhook triggered)" \
  "## Objective
Edge Function triggered by health_log INSERT. Fetches last 30 logs. Computes score. Stores result. Broadcasts via Realtime. <3s total execution.

## Acceptance Criteria
- [ ] Score generated within 3s of log submission
- [ ] Realtime update received on client
- [ ] Score visible without refresh
- [ ] Tested via Supabase local

**Estimated:** 4h | **Difficulty:** S" \
  "ai,backend,P0: Critical,sprint-1,mvp,task" \
  "M1: MVP Week 1"

create_issue \
  "[AI] Build Edge Function: analyze-pet-image (authenticated, rate-limited)" \
  "## Objective
Edge Function invoked via REST. Auth: validates JWT, confirms pet ownership. Calls GPT-4o Vision. Stores result. Triggers anomaly check on concerning findings.

## Acceptance Criteria
- [ ] Analysis returns in <8s P95
- [ ] Ownership validated — cross-pet access blocked
- [ ] Concerning findings generate anomaly record
- [ ] Rate limit enforced per plan tier

**Estimated:** 6h | **Difficulty:** M" \
  "ai,camera,backend,P0: Critical,sprint-1,mvp,task" \
  "M1: MVP Week 1"

create_issue \
  "[AI] Implement AI abuse prevention (prompt injection, jailbreak detection)" \
  "## Objective
Sanitize notes field: strip markdown, limit 500 chars, block known injection patterns. XML-isolate user content in prompts. Monitor for unusual output patterns.

## Acceptance Criteria
- [ ] Injection test suite (20 cases) all blocked
- [ ] Rate limits enforced
- [ ] Refusal events logged in Sentry
- [ ] Normal usage not affected

**Estimated:** 5h | **Difficulty:** M" \
  "ai,security,P1: High,sprint-2,task" \
  "M2: MVP Week 2"

# ── FRONTEND ISSUES ────────────────────────────────────────

create_issue \
  "[FE] Build pet onboarding flow (5-step wizard)" \
  "## Objective
Welcome → Add pet → First log → Camera scan invitation → Score reveal. Progress persisted in Supabase. Skippable steps with reminder notification.

## Acceptance Criteria
- [ ] New user completes onboarding in <5 min
- [ ] Completion rate tracked in PostHog
- [ ] Works on mobile web + native
- [ ] No dead ends

**Estimated:** 12h | **Difficulty:** XL" \
  "frontend,ux,P0: Critical,sprint-1,mvp,task" \
  "M1: MVP Week 1"

create_issue \
  "[FE] Build daily health logging UI with slider inputs and streak tracking" \
  "## Objective
Slider inputs (1-5) with emoji + label. Swipe-to-submit on mobile. Optimistic update. Streak indicator (fire if logged yesterday). Quick-log mode pre-fills yesterday.

## Acceptance Criteria
- [ ] Log submission in <3 taps
- [ ] Optimistic update shows calculating state
- [ ] Streak displayed correctly
- [ ] Works offline (queued sync)

**Estimated:** 8h | **Difficulty:** L" \
  "frontend,ux,P0: Critical,sprint-1,mvp,task" \
  "M1: MVP Week 1"

create_issue \
  "[FE] Build health dashboard with score card, trend chart, anomaly alerts" \
  "## Objective
Score card (0-100, color gradient, trend arrow). 30-day line chart. Anomaly alert dismissible banner. Camera scan CTA. Recent activity feed.

## Acceptance Criteria
- [ ] Dashboard loads in <1.5s
- [ ] Chart renders 30 points without lag
- [ ] Anomaly alert dismiss persists
- [ ] Score color matches gradient correctly

**Estimated:** 10h | **Difficulty:** L" \
  "frontend,ux,P0: Critical,sprint-1,mvp,task" \
  "M1: MVP Week 1"

create_issue \
  "[FE] Implement camera capture and upload UX (iOS + Android)" \
  "## Objective
Camera permission request with explanation. Live preview. Capture with shutter animation. Preview + retake. Upload progress. Analysis thinking animation (Lottie). Results reveal.

## Acceptance Criteria
- [ ] Camera permission UX passes App Store review
- [ ] Upload progress shown
- [ ] Analysis thinking state engaging
- [ ] Works on iOS 16+ and Android 12+

**Estimated:** 10h | **Difficulty:** L" \
  "frontend,ux,camera,P0: Critical,sprint-1,mvp,task" \
  "M1: MVP Week 1"

create_issue \
  "[FE] Build notification center and in-app alert UI" \
  "## Objective
Notification list with type icons. Unread count badge. Mark as read. Swipe to dismiss. Empty state. Deep link from push notification to specific alert.

## Acceptance Criteria
- [ ] Unread badge updates via Realtime
- [ ] Swipe dismiss works iOS + Android
- [ ] Deep link opens correct pet alert
- [ ] Empty state is engaging

**Estimated:** 6h | **Difficulty:** M" \
  "frontend,notifications,ux,P1: High,sprint-2,task" \
  "M2: MVP Week 2"

create_issue \
  "[FE] Create pet profile management screens (add, edit, archive, multi-pet)" \
  "## Objective
Pet list screen. Add pet flow (modal). Edit pet: all fields. Photo update. Pet archive (soft delete + undo). Multi-pet switcher in top nav.

## Acceptance Criteria
- [ ] Add pet works
- [ ] Photo upload works
- [ ] Archive → restore works
- [ ] Multi-pet switcher switches context

**Estimated:** 6h | **Difficulty:** M" \
  "frontend,P1: High,sprint-2,task" \
  "M2: MVP Week 2"

create_issue \
  "[FE] Implement subscription paywall and Stripe upgrade flow" \
  "## Objective
Paywall screen with feature comparison. Stripe Checkout (server-side session). Success redirect + activation. Contextual upgrade prompts (not full paywall). RevenueCat for mobile IAP.

## Acceptance Criteria
- [ ] Stripe Checkout completes
- [ ] Subscription activates in <5s
- [ ] IAP works on iOS + Android
- [ ] Trial converts correctly

**Estimated:** 10h | **Difficulty:** L" \
  "frontend,payments,P1: High,sprint-2,mvp,task" \
  "M2: MVP Week 2"

create_issue \
  "[FE] Build settings screen with notification preferences" \
  "## Objective
Settings sections: Profile, Pets, Notifications, Subscription, Privacy, Help, Sign Out. Notification toggles sync to OneSignal tags. Preference stored in Supabase.

## Acceptance Criteria
- [ ] Preference changes persist
- [ ] OneSignal tags updated within 1 min
- [ ] Sign out clears local session
- [ ] Privacy links work

**Estimated:** 5h | **Difficulty:** M" \
  "frontend,notifications,P2: Medium,sprint-2,task" \
  "M2: MVP Week 2"

create_issue \
  "[FE] Add animations and micro-interactions (Framer Motion / Reanimated)" \
  "## Objective
Score reveal count-up. Tab bar spring physics. Anomaly alert red pulse. Onboarding slide transitions. Score card gradient breath on calculating state. Loading skeletons everywhere.

## Acceptance Criteria
- [ ] 60fps on mid-range Android
- [ ] Respects prefers-reduced-motion
- [ ] No layout shift during animation
- [ ] Skeletons match content layout

**Estimated:** 6h | **Difficulty:** M" \
  "frontend,ux,P2: Medium,sprint-2,task" \
  "M2: MVP Week 2"

create_issue \
  "[FE] Implement accessibility (WCAG 2.1 AA compliance)" \
  "## Objective
All interactive elements: accessible, accessibilityLabel, accessibilityRole. VoiceOver/TalkBack full traversal. 44px touch targets. Color contrast ≥4.5:1. Dynamic type support.

## Acceptance Criteria
- [ ] VoiceOver navigates full onboarding
- [ ] All scores readable by screen reader
- [ ] Color contrast audit passes
- [ ] No accessibility lint errors

**Estimated:** 8h | **Difficulty:** L" \
  "frontend,ux,P2: Medium,sprint-3,beta,task" \
  "M3: Closed Beta"

# ── BACKEND ISSUES ────────────────────────────────────────

create_issue \
  "[BE] Design REST API v1 with versioning and OpenAPI spec" \
  "## Objective
/api/v1/ prefix. OpenAPI 3.1 spec auto-generated via Zod (zod-to-openapi). TypeScript types generated from spec. All routes match spec.

## Acceptance Criteria
- [ ] OpenAPI spec generated and committed
- [ ] All routes match spec
- [ ] TypeScript types generated
- [ ] 100% route coverage in integration tests

**Estimated:** 6h | **Difficulty:** M" \
  "api,backend,P1: High,sprint-1,mvp,task" \
  "M1: MVP Week 1"

create_issue \
  "[BE] Implement image processing pipeline (upload, resize, EXIF strip, R2 storage)" \
  "## Objective
Client uploads to Supabase Storage → Edge Function. Resize 1024px max. JPEG 85%. Strip EXIF. Upload to R2 with signed URL. Return processed URL + metadata.

## Acceptance Criteria
- [ ] 10MB input → <500KB output
- [ ] EXIF stripped (verified via exifr)
- [ ] R2 upload in <2s
- [ ] Signed URLs expire in 1h

**Estimated:** 6h | **Difficulty:** M" \
  "backend,camera,P0: Critical,sprint-1,mvp,task" \
  "M1: MVP Week 1"

create_issue \
  "[BE] Build async job queue for AI processing (pg-boss)" \
  "## Objective
pg-boss on Supabase Postgres. Job types: health_score_compute, camera_analysis, anomaly_check, notification_send. Worker via Edge Function. Dead letter queue with Sentry alert.

## Acceptance Criteria
- [ ] No HTTP timeouts on AI endpoints
- [ ] Failed jobs retried 3x correctly
- [ ] DLQ alert fires in Sentry
- [ ] Job status queryable by frontend

**Estimated:** 8h | **Difficulty:** L" \
  "backend,ai,infra,P1: High,sprint-2,task" \
  "M2: MVP Week 2"

create_issue \
  "[BE] Implement API rate limiting with Upstash Redis sliding window" \
  "## Objective
100 API req/min (free), 500/min (pro). AI endpoints: 10 camera/day (free), 50/day (pro). Rate limit key: userId + endpoint. Return 429 with Retry-After header.

## Acceptance Criteria
- [ ] 101st request in 60s → 429
- [ ] Headers on all API responses
- [ ] Pro users have higher limits
- [ ] State persists across Edge Function restarts

**Estimated:** 4h | **Difficulty:** S" \
  "backend,security,P1: High,sprint-2,task" \
  "M2: MVP Week 2"

create_issue \
  "[BE] Build Stripe subscription management (webhooks, billing portal, dunning)" \
  "## Objective
Stripe Checkout session creation. Webhooks: subscription created/updated/deleted, payment_failed. Signature validation. Idempotent webhook processing. Customer Portal. 14-day trial. Dunning: 3 failures before cancel.

## Acceptance Criteria
- [ ] Checkout completes
- [ ] Webhooks processed idempotently
- [ ] Customer Portal accessible from settings
- [ ] Payment failure updates subscription status within 60s

**Estimated:** 8h | **Difficulty:** L" \
  "backend,payments,P0: Critical,sprint-2,mvp,task" \
  "M2: MVP Week 2"

create_issue \
  "[BE] Add observability: structured logging, Sentry traces, PostHog events" \
  "## Objective
Structured JSON logging in Edge Functions. Sentry: error capture + performance traces. PostHog: all core business events. Custom retention dashboard.

## Acceptance Criteria
- [ ] Every API error in Sentry with trace
- [ ] Business events firing in PostHog
- [ ] Log drain configured in Vercel
- [ ] Structured logs searchable

**Estimated:** 5h | **Difficulty:** M" \
  "backend,analytics,infra,P1: High,sprint-2,task" \
  "M2: MVP Week 2"

create_issue \
  "[BE] Implement caching strategy (Upstash Redis + Vercel Edge Cache)" \
  "## Objective
Cache health scores (TTL: 24h, bust on new log). Cache baseline models (TTL: 24h). Vercel Edge Cache for public routes. Cache hit rate target >80%.

## Acceptance Criteria
- [ ] Cache hit rate >80% on score reads
- [ ] Score reads <50ms when cached
- [ ] Cache invalidated on new log
- [ ] Cache hit rate tracked in observability

**Estimated:** 4h | **Difficulty:** S" \
  "backend,performance,P2: Medium,sprint-3,task" \
  "M3: Closed Beta"

create_issue \
  "[BE] Build health report PDF export for Pro users" \
  "## Objective
@react-pdf/renderer. Report: pet profile, 90-day trend chart, anomaly history, camera analysis summary. Generated server-side, stored in R2, signed URL. Pro gate enforced.

## Acceptance Criteria
- [ ] PDF generates in <10s
- [ ] Charts render in PDF
- [ ] Download works from app
- [ ] Pro gate enforced

**Estimated:** 6h | **Difficulty:** M" \
  "backend,P2: Medium,sprint-3,beta,task" \
  "M3: Closed Beta"

# ── DEVOPS ISSUES ─────────────────────────────────────────

create_issue \
  "[INFRA] Set up CI/CD pipeline with GitHub Actions (8-min target)" \
  "## Objective
ci.yml: typecheck → lint → test → migration-check → secret-scan → npm-audit → build → ci-gate. Branch protection on main. npm + Next.js build cache.

## Acceptance Criteria
- [ ] CI runs in <8 min
- [ ] All checks enforce merge protection
- [ ] Secret scan blocks leaked secrets
- [ ] Cache reduces time by >40%

**Estimated:** 5h | **Difficulty:** M" \
  "infra,P0: Critical,sprint-1,mvp,task" \
  "M0: Foundation"

create_issue \
  "[INFRA] Configure staging and production deployment pipelines" \
  "## Objective
Staging: auto-deploy on push to staging. Preview URLs on every PR. Production: manual dispatch + approval. Supabase migrations before function deploy. Smoke tests post-deploy. Slack notify.

## Acceptance Criteria
- [ ] PR gets preview URL in <5 min
- [ ] Staging deploy automated
- [ ] Production requires manual approval
- [ ] Rollback achievable in <5 min

**Estimated:** 6h | **Difficulty:** M" \
  "infra,P0: Critical,sprint-1,mvp,task" \
  "M0: Foundation"

create_issue \
  "[INFRA] Set up secrets management (GitHub Secrets + Vercel env vars)" \
  "## Objective
All secrets in GitHub Secrets (CI) and Vercel env (runtime). Separate per environment. Gitleaks pre-commit hook. .env.example as only committed env file.

## Acceptance Criteria
- [ ] Zero secrets in git history
- [ ] All secrets accessible in CI + production
- [ ] Local dev via vercel env pull
- [ ] Rotation runbook documented

**Estimated:** 3h | **Difficulty:** S" \
  "infra,security,P0: Critical,sprint-1,mvp,task" \
  "M0: Foundation"

create_issue \
  "[INFRA] Implement monitoring and alerting (Sentry + PagerDuty)" \
  "## Objective
Sentry: error rate >1% triggers alert. Vercel: function timeout alerts. /api/health endpoint. PagerDuty on-call rotation. Runbook for each alert type.

## Acceptance Criteria
- [ ] Health check returns 200 with all services status
- [ ] Error spike triggers PagerDuty in <2 min
- [ ] Runbook linked from every alert type

**Estimated:** 5h | **Difficulty:** M" \
  "infra,P1: High,sprint-2,task" \
  "M2: MVP Week 2"

create_issue \
  "[INFRA] Configure Cloudflare R2 for image storage with lifecycle policies" \
  "## Objective
R2 buckets for prod + staging. Presigned upload URLs (15min TTL). CDN with custom domain. Lifecycle: processed images 2 years, originals 90 days. CORS for app domains only.

## Acceptance Criteria
- [ ] Upload via presigned URL works
- [ ] CDN <100ms TTFB
- [ ] Lifecycle policies confirmed
- [ ] CORS blocks non-app origins

**Estimated:** 4h | **Difficulty:** S" \
  "infra,P1: High,sprint-1,mvp,task" \
  "M1: MVP Week 1"

create_issue \
  "[INFRA] Implement rollback system and deployment recovery runbook" \
  "## Objective
Vercel instant rollback. Migration rollback scripts per migration file. Feature flags via Edge Config to disable features without deploy. Rollback drill in staging.

## Acceptance Criteria
- [ ] Vercel rollback tested and documented
- [ ] Migration rollback scripts tested locally
- [ ] Feature flag disables AI in <30s
- [ ] Drill completed

**Estimated:** 4h | **Difficulty:** S" \
  "infra,P1: High,sprint-2,task" \
  "M2: MVP Week 2"

# ── QA + SECURITY ─────────────────────────────────────────

create_issue \
  "[QA] Write unit and integration test suite (target: 80% coverage)" \
  "## Objective
Vitest unit tests for: health score algorithm, anomaly detection, Stripe webhook handler, rate limiter, Zod schemas. Supabase local integration tests for RLS policies.

## Acceptance Criteria
- [ ] 80% line coverage on packages/ai and supabase/functions
- [ ] RLS: user A cannot read user B's data (tested)
- [ ] All Zod schemas have invalid input tests
- [ ] Coverage report to Codecov

**Estimated:** 12h | **Difficulty:** XL" \
  "P1: High,sprint-2,mvp,task" \
  "M2: MVP Week 2"

create_issue \
  "[QA] Implement E2E test suite with Playwright (4 critical flows)" \
  "## Objective
Playwright flows: 1) Signup → onboarding → first log → score, 2) Camera scan → analysis → anomaly, 3) Subscription → Stripe → unlock, 4) Account deletion → purge.

## Acceptance Criteria
- [ ] 4 E2E flows passing in CI
- [ ] CI runs in <10 min
- [ ] Flake rate <5%
- [ ] Playwright report as CI artifact

**Estimated:** 10h | **Difficulty:** L" \
  "P1: High,sprint-3,beta,task" \
  "M3: Closed Beta"

create_issue \
  "[SEC] Conduct security audit (OWASP Top 10 + AI-specific risks)" \
  "## Objective
OWASP checklist: SQLi, XSS, CSRF, IDOR, broken auth, sensitive data. AI-specific: prompt injection, data exfiltration, PII in logs. Document findings + fixes.

## Acceptance Criteria
- [ ] All OWASP Top 10 items checked
- [ ] Zero critical/high vulnerabilities open at launch
- [ ] AI risks documented with mitigations
- [ ] Audit report in docs/compliance/

**Estimated:** 8h | **Difficulty:** L" \
  "security,P0: Critical,sprint-3,beta,task" \
  "M3: Closed Beta"

create_issue \
  "[SEC] Implement GDPR + privacy compliance (consent, portability, erasure)" \
  "## Objective
Explicit analytics consent (EU users). Cookie banner. Data portability: export all user data as JSON. Erasure: 30-day purge pipeline. Privacy policy. DPA with Supabase + OpenAI.

## Acceptance Criteria
- [ ] Consent captured before analytics
- [ ] Export returns all data in <10 min
- [ ] Purge completes within 30 days
- [ ] Privacy policy reviewed by counsel

**Estimated:** 8h | **Difficulty:** L" \
  "security,backend,P1: High,sprint-3,beta,task" \
  "M3: Closed Beta"

create_issue \
  "[QA] Add AI model evaluation and regression testing in CI" \
  "## Objective
50-case ground truth dataset. Eval script in CI on AI-related PRs. Metrics: score MAE, anomaly precision/recall, camera F1. Automated PR comment. Block merge on regression.

## Acceptance Criteria
- [ ] Eval in CI in <5 min
- [ ] PR comment shows metric comparison
- [ ] Merge blocked on regression
- [ ] Eval dataset version-controlled

**Estimated:** 6h | **Difficulty:** M" \
  "ai,P2: Medium,sprint-3,task" \
  "M3: Closed Beta"

create_issue \
  "[SEC] API penetration testing and endpoint fuzzing" \
  "## Objective
OWASP ZAP scan against staging. Manual pen test: IDOR, mass assignment, rate limit bypass, JWT manipulation. Fuzzing on all endpoints. Document and fix all findings.

## Acceptance Criteria
- [ ] ZAP scan: 0 high/critical findings
- [ ] Manual pen test report filed
- [ ] All P0/P1 findings fixed before launch

**Estimated:** 10h | **Difficulty:** L" \
  "security,P1: High,sprint-3,beta,task" \
  "M3: Closed Beta"

# ── ANALYTICS + GROWTH ────────────────────────────────────

create_issue \
  "[ANALYTICS] Implement product analytics (PostHog events and funnels)" \
  "## Objective
PostHog SDK web + mobile. Events: user_signed_up, pet_added, health_log_submitted, camera_scan_completed, anomaly_alert_viewed, subscription_started, subscription_cancelled. Funnels + D7 retention cohort.

## Acceptance Criteria
- [ ] All events firing in production
- [ ] Onboarding funnel visible
- [ ] D7 retention cohort established
- [ ] Feature flag deployed

**Estimated:** 5h | **Difficulty:** M" \
  "analytics,P1: High,sprint-2,task" \
  "M2: MVP Week 2"

create_issue \
  "[GROWTH] Build referral program infrastructure" \
  "## Objective
Unique referral code per user. Shareable URL with UTM. Attribution in PostHog + Supabase. Reward: 1 month free Pro on referred user's first payment. Referral dashboard in settings.

## Acceptance Criteria
- [ ] Referral link generates correctly
- [ ] Attribution tracked end-to-end
- [ ] Reward granted automatically via Stripe coupon
- [ ] Dashboard shows correct count

**Estimated:** 6h | **Difficulty:** M" \
  "backend,frontend,P2: Medium,sprint-3,beta,task" \
  "M3: Closed Beta"

create_issue \
  "[ADMIN] Create admin dashboard for operations team" \
  "## Objective
Next.js admin route (admin-only 2FA). Views: user list, subscription status, anomaly feed, AI job queue, health score distribution, error rates. Impersonation mode (logged in audit trail).

## Acceptance Criteria
- [ ] Admin login requires 2FA
- [ ] Impersonation logged in audit trail
- [ ] All views load in <2s
- [ ] Admin actions logged immutably

**Estimated:** 10h | **Difficulty:** L" \
  "frontend,backend,P2: Medium,sprint-3,task" \
  "M3: Closed Beta"

# ── EPICS ────────────────────────────────────────────────

create_issue \
  "[EPIC] AI Health Intelligence Engine" \
  "## Business Objective
Core differentiator — predictive health scoring and anomaly detection before symptoms appear.

## Technical Scope
GPT-4o Vision, time-series anomaly detection, baseline behavior modeling, health score composite algorithm, confidence scoring, explainability.

## Sub-issues
- [ ] #11 — Health score algorithm
- [ ] #12 — Camera analysis pipeline
- [ ] #13 — Baseline behavior modeling
- [ ] #14 — Anomaly detection
- [ ] #15 — AI explainability
- [ ] #16 — Confidence scoring
- [ ] #17 — AI guardrails
- [ ] #18 — Eval pipeline
- [ ] #19 — Prompt versioning
- [ ] #20 — generate-health-score function
- [ ] #21 — analyze-pet-image function
- [ ] #22 — Abuse prevention

## Success Metrics
- Anomaly precision >70% at beta
- Health score MAE <10 pts vs vet assessment
- Camera analysis <8s P95

## Risks
- False positive rate eroding trust
- GPT-4o Vision hallucination in medical context
- Latency at scale" \
  "epic,ai,P0: Critical,mvp" \
  "M1: MVP Week 1"

create_issue \
  "[EPIC] User Onboarding and Activation" \
  "## Business Objective
Get users to their first health score within 5 minutes of signup. Activation = first score revealed.

## Technical Scope
5-step wizard, progress persistence, skip/resume, first-time UX copy, emotional design.

## Sub-issues
- [ ] #7 — Auth
- [ ] #23 — Onboarding flow
- [ ] #24 — Health log UI
- [ ] #25 — Dashboard
- [ ] #26 — Camera UX

## Success Metrics
- Onboarding completion rate >60%
- Time to first score <5 min
- D1 retention >50%

## Risks
- Drop-off before first value moment
- Camera permission denial on iOS" \
  "epic,frontend,ux,P0: Critical,mvp" \
  "M1: MVP Week 1"

create_issue \
  "[EPIC] Subscription and Monetization System" \
  "## Business Objective
Revenue. Freemium to Pro conversion. 14-day trial to reduce signup friction.

## Technical Scope
Stripe Checkout, webhook handling, plan enforcement middleware, RevenueCat (mobile IAP), feature flags per tier, dunning.

## Sub-issues
- [ ] #29 — Subscription paywall UI
- [ ] #37 — Stripe webhook management
- [ ] #53 — Analytics funnels

## Success Metrics
- Checkout conversion >60%
- Trial → paid >15%
- Payment failure recovery >40%

## Risks
- Paywall placement killing activation
- App Store 30% commission on mobile IAP" \
  "epic,payments,backend,P1: High,mvp" \
  "M2: MVP Week 2"

echo ""
echo "✅ All 55 issues created!"
echo ""
echo "Next steps:"
echo "  1. Set up project board: bash scripts/setup-project-board.sh"
echo "  2. Assign issues to sprints via GitHub Projects"
echo "  3. Enable branch protection on main"
