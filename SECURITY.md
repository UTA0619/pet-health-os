# Security Policy — Pet Health OS

## Reporting a Vulnerability

**Do NOT open a public GitHub issue for security vulnerabilities.**

Email: `security@pethealthos.com`

Include:
- Vulnerability type and affected component
- Steps to reproduce
- Potential impact assessment
- Your contact information (for coordinated disclosure)

### Response SLA

| Severity | Acknowledgment | Resolution |
|---|---|---|
| Critical (P0) | 2 hours | 24 hours |
| High (P1) | 8 hours | 72 hours |
| Medium (P2) | 24 hours | 7 days |
| Low (P3) | 72 hours | 30 days |

### Supported Versions

Only the latest production release and the previous minor version receive security patches.

---

## Security Architecture

### Authentication

- **Provider:** Supabase Auth with RS256 JWT tokens
- **SSO:** Google OAuth (PKCE), Apple Sign-In (required for iOS)
- **Session:** Refresh token rotation on every refresh. Session invalidated on password change.
- **MFA:** TOTP available for admin accounts (required)
- **JWT validation:** Every API route and Edge Function validates JWT before processing

### Data Protection

| Data Type | Protection |
|---|---|
| Data at rest | AES-256 (Supabase managed) |
| Data in transit | TLS 1.3+ (enforced by Cloudflare) |
| Pet images | Cloudflare R2 with signed URLs (1h expiry), EXIF stripped on upload |
| API keys | GitHub Secrets (CI), Vercel environment variables (runtime) — never in code |

### Row-Level Security (RLS)

- Every table has RLS enabled — no exceptions
- Users can only read/write their own data
- Edge Functions use service role in isolated contexts only
- RLS policies audited quarterly
- Integration tests verify cross-user data isolation

### API Security

| Control | Implementation |
|---|---|
| Authentication | JWT required on all `/api/*` routes |
| Rate limiting | 100 req/min (free), 500/min (pro) via Upstash Redis |
| AI rate limiting | 10 camera analyses/day (free), 50/day (pro) |
| Input validation | Zod schemas at every API boundary |
| SQL injection | Parameterized queries only — no string interpolation |
| Output encoding | CSP headers, React's automatic XSS escaping |
| CORS | Allowlist: app domains only |

### Security Headers

All API responses include:
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'; ...
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

### Mobile Security

- Sensitive data stored in SecureStore (never AsyncStorage)
- Certificate pinning for API calls
- Jailbreak/root detection (soft warning, not block)
- Biometric auth option for app lock

### AI Data Handling

- User data excluded from OpenAI model training (Enterprise agreement)
- Pet images sent to OpenAI are not retained beyond the API call
- Health log text XML-isolated in prompts to prevent injection
- AI outputs filtered: no medical diagnoses, no drug recommendations
- Prompt injection test suite runs in CI on every AI-related PR
- PII is never logged in structured logs (pet_id masked, no names)

---

## Pre-Release Security Checklist

Before every production release:

- [ ] `gitleaks` secret scan passes (no secrets in git history)
- [ ] `npm audit` shows 0 critical/high vulnerabilities
- [ ] RLS policies verified for all new tables
- [ ] Auth middleware confirmed on all new routes
- [ ] Input validation (Zod) present on all new API endpoints
- [ ] Rate limiting applied to all new AI endpoints
- [ ] CSP headers updated for any new external resources
- [ ] OWASP Top 10 review completed for changed components
- [ ] AI guardrails tested: no medical diagnoses in outputs
- [ ] New secrets added to Vercel env + documented in `.env.example`

---

## Incident Response

See [docs/operations/INCIDENT_RESPONSE.md](docs/operations/INCIDENT_RESPONSE.md) for the full on-call runbook.

**Emergency escalation:** PagerDuty → `#incidents` Slack channel → CTO direct
