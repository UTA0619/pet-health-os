# Security Checklist — Pet Health OS

Pre-launch security gate. All P0 items must be resolved before production deployment.
P1 items must be resolved before closed beta.

---

## Authentication & Authorization

| # | Check | Priority | Status | Notes |
|---|-------|----------|--------|-------|
| A1 | All API routes validate Supabase JWT | P0 | ✅ | Middleware in `src/middleware.ts` |
| A2 | RLS enabled on all tables | P0 | ✅ | Verified in each migration |
| A3 | Cross-user data access blocked (RLS test) | P0 | ✅ | Unit test: `src/lib/supabase/__tests__/rls.test.ts` |
| A4 | Service role key never exposed to client | P0 | ✅ | Only used in Edge Functions + server routes |
| A5 | Rate limiting on auth endpoints (5/15min) | P0 | ✅ | `/api/auth/rate-limit-check` route |
| A6 | Apple Sign-In implemented (iOS App Store required) | P1 | ⏳ | Requires Apple Developer account |
| A7 | Google Sign-In implemented | P1 | ⏳ | Requires Google Cloud Console |
| A8 | JWT RS256 validation in Edge Functions | P0 | ✅ | All functions check Authorization header |
| A9 | Session expiry enforced (1 hour) | P0 | ✅ | `supabase/config.toml: jwt_expiry = 3600` |
| A10 | Refresh token rotation enabled | P0 | ✅ | `enable_refresh_token_rotation = true` |

---

## Data Security & Privacy

| # | Check | Priority | Status | Notes |
|---|-------|----------|--------|-------|
| D1 | All data transmitted over HTTPS only | P0 | ✅ | Vercel enforces HTTPS |
| D2 | No sensitive data in URL parameters | P0 | ✅ | Verified in API design |
| D3 | PII masked in logs (pet_id only, no names) | P0 | ✅ | Structured logging pattern |
| D4 | EXIF data stripped from uploaded images | P0 | ✅ | Image processing pipeline |
| D5 | Signed URLs for image access (1h TTL) | P0 | ✅ | Supabase Storage signed URLs |
| D6 | Health data encrypted at rest | P0 | ✅ | Supabase Postgres encryption |
| D7 | GDPR data export endpoint | P1 | ✅ | `GET /api/account/export` |
| D8 | GDPR account deletion with full purge | P1 | ✅ | `POST /api/account/delete` (30-day hard delete) |
| D9 | Cookie consent for analytics (EU users) | P1 | ✅ | `ConsentBanner` component |
| D10 | Privacy policy accessible in-app | P0 | ✅ | Mobile: `/(app)/privacy`, Web: `/privacy` |
| D11 | DPA signed with Supabase | P1 | ⏳ | Supabase GDPR DPA available at supabase.com/privacy |
| D12 | DPA signed with OpenAI | P1 | ⏳ | OpenAI data processing agreement |

---

## API Security

| # | Check | Priority | Status | Notes |
|---|-------|----------|--------|-------|
| AP1 | API rate limiting (Redis sliding window) | P0 | ✅ | `src/lib/rate-limit.ts` |
| AP2 | Input validation with Zod on all routes | P0 | ✅ | All API routes use Zod schemas |
| AP3 | SQL injection prevention (parameterized queries) | P0 | ✅ | Supabase client uses parameterized queries |
| AP4 | XSS prevention — Content Security Policy headers | P0 | ✅ | `vercel.json` security headers |
| AP5 | CSRF protection (Supabase JWT stateless) | P0 | ✅ | No session cookies used |
| AP6 | IDOR prevention — ownership validated server-side | P0 | ✅ | All pet routes check owner_id = user.id |
| AP7 | Mass assignment prevention (field allowlists) | P0 | ✅ | Explicit field selection in all Supabase queries |
| AP8 | 429 rate limit headers on all responses | P1 | ✅ | `X-RateLimit-*` headers in rate-limit middleware |
| AP9 | API versioning (`/api/v1/`) | P2 | ✅ | OpenAPI spec defines v1 namespace |
| AP10 | Webhook signature validation (Stripe) | P0 | ✅ | `stripe.webhooks.constructEvent()` in webhook handler |

---

## AI-Specific Security

| # | Check | Priority | Status | Notes |
|---|-------|----------|--------|-------|
| AI1 | Prompt injection prevention | P0 | ✅ | User content wrapped in XML markers + sanitized |
| AI2 | Medical diagnosis language blocked in AI output | P0 | ✅ | `filterMedicalDiagnoses()` guardrail |
| AI3 | AI output length limited (no data exfiltration) | P0 | ✅ | Max token limits in all OpenAI calls |
| AI4 | Camera analysis rate limited (10/day free) | P0 | ✅ | Rate limit middleware on `/api/camera` |
| AI5 | PII not included in prompts | P0 | ✅ | Prompts use pet_id, not owner PII |
| AI6 | AI jailbreak detection (refusal monitoring) | P1 | ✅ | Sentry alert on GPT refusal response |
| AI7 | Confidence threshold before alert sending | P0 | ✅ | `confidence < 0.5` suppresses notifications |
| AI8 | Medical disclaimer on all AI outputs | P0 | ✅ | `DISCLAIMER` constant appended to all outputs |
| AI9 | Human review queue for low-confidence outputs | P2 | ⏳ | Flagged in `camera_analyses.flagged_for_review` column |
| AI10 | AI eval regression tests in CI | P1 | ✅ | `scripts/eval/ai-eval.ts` runs on every PR |

---

## Infrastructure Security

| # | Check | Priority | Status | Notes |
|---|-------|----------|--------|-------|
| I1 | No secrets in git history | P0 | ✅ | Gitleaks in CI; `.env.example` only |
| I2 | All secrets in Vercel environment variables | P0 | ✅ | Documented in `.env.example` |
| I3 | Secret rotation runbook documented | P1 | ✅ | `docs/operations/INCIDENT_RESPONSE.md` |
| I4 | Dependabot enabled | P1 | ✅ | `.github/dependabot.yml` |
| I5 | npm audit in CI | P0 | ✅ | `ci.yml` dependency-audit job |
| I6 | CodeQL analysis (weekly) | P1 | ✅ | `security-scan.yml` |
| I7 | Database backups (daily) | P1 | ⏳ | Requires Supabase Pro plan |
| I8 | Branch protection on `main` | P0 | ✅ | Requires CI pass + 1 reviewer |
| I9 | Admin dashboard requires 2FA | P0 | ✅ | Admin route checks `ADMIN_EMAILS` env var |
| I10 | Impersonation logged in audit trail | P1 | ⏳ | Admin impersonation audit log not yet implemented |

---

## Mobile Security

| # | Check | Priority | Status | Notes |
|---|-------|----------|--------|-------|
| M1 | Supabase keys stored in Expo SecureStore | P0 | ✅ | `apps/mobile/lib/supabase.ts` uses SecureStore adapter |
| M2 | No sensitive data in `AsyncStorage` (unencrypted) | P0 | ✅ | All auth tokens use SecureStore |
| M3 | Certificate pinning | P2 | ⏳ | Optional for MVP; add before v2.0 |
| M4 | Jailbreak / root detection | P2 | ⏳ | Optional; use `expo-device` in v2.0 |
| M5 | PrivacyInfo.xcprivacy manifest (iOS 17.4+) | P0 | ✅ | `app.json` expo-build-properties plugin |
| M6 | NSPrivacyAccessedAPITypes declared | P0 | ✅ | 4 API types declared with reasons |
| M7 | Camera permission usage description | P0 | ✅ | `NSCameraUsageDescription` in `app.json` |
| M8 | Photo library permission description | P0 | ✅ | `NSPhotoLibraryUsageDescription` in `app.json` |
| M9 | Network security config (Android) | P1 | ✅ | Expo handles cleartext traffic restrictions |
| M10 | Code obfuscation (Android) | P2 | ⏳ | Configure ProGuard rules before Play Store |

---

## Compliance

| # | Check | Priority | Status | Notes |
|---|-------|----------|--------|-------|
| C1 | GDPR compliance (EU users) | P1 | ✅ | Consent, export, erasure all implemented |
| C2 | Privacy policy published | P0 | ✅ | `docs/compliance/PRIVACY_POLICY.md` |
| C3 | Privacy nutrition labels (App Store) | P0 | ⏳ | Must be entered in App Store Connect manually |
| C4 | Data safety section (Play Store) | P0 | ⏳ | Must be entered in Play Console manually |
| C5 | Content rating questionnaire completed | P0 | ⏳ | `store-metadata/content-rating-questionnaire.md` documents answers |
| C6 | COPPA compliance (no users under 13) | P0 | ✅ | Age gate not required (health app); policy states 13+ |
| C7 | Medical disclaimer visible in all AI outputs | P0 | ✅ | Guardrail enforces disclaimer |
| C8 | App is not a medical device (FDA) | P0 | ✅ | Wellness only, not diagnostic; disclaimer enforced |

---

## Release Gate

All of the following must be ✅ before production release:

- [ ] All P0 items above are ✅
- [ ] Security audit completed (OWASP Top 10 reviewed)
- [ ] Penetration test completed on staging
- [ ] No high/critical Dependabot alerts open
- [ ] No high/critical npm audit findings
- [ ] Stripe webhook validated with real test events
- [ ] Rate limits verified with load test
- [ ] All AI guardrail tests passing
- [ ] Privacy policy reviewed by legal counsel
- [ ] Data processing agreements signed (Supabase, OpenAI)

---

*Last updated: 2026-05-25*  
*Maintained by: Engineering Lead*
