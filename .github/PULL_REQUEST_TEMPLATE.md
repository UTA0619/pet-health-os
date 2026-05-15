## Summary

<!-- 1–3 bullet points describing what changed and why -->
-
-

Closes #<!-- issue number -->

---

## Type of Change

- [ ] `feat` — New feature
- [ ] `fix` — Bug fix
- [ ] `perf` — Performance improvement
- [ ] `refactor` — Code cleanup (no behavior change)
- [ ] `ai` — AI model, prompt, or evaluation change
- [ ] `db` — Database migration or schema change
- [ ] `infra` — CI/CD, deployment, infrastructure
- [ ] `docs` — Documentation only
- [ ] `test` — Tests only
- [ ] `chore` — Dependency update or tooling

## Scope

- [ ] `auth` · [ ] `ai` · [ ] `camera` · [ ] `score` · [ ] `anomaly`
- [ ] `pets` · [ ] `onboarding` · [ ] `notifications` · [ ] `payments`
- [ ] `db` · [ ] `infra` · [ ] `frontend` · [ ] `mobile`

---

## Description

<!-- What does this PR do? What problem does it solve? -->

---

## AI Context *(fill if `ai` type)*

**Prompt version before:** <!-- e.g. health-score-v1.2 -->
**Prompt version after:** <!-- e.g. health-score-v1.3 -->

**Eval results:**
| Metric | Before | After | Delta |
|---|---|---|---|
| Precision | | | |
| Recall | | | |
| MAE | | | |

**Guardrails verified:**
- [ ] No medical diagnoses in outputs
- [ ] User content XML-isolated in prompts
- [ ] Confidence scoring present
- [ ] Fallback response tested

---

## Database Migration *(fill if `db` type)*

- [ ] Migration file created (`supabase/migrations/NNN_*.sql`)
- [ ] RLS policies included in migration
- [ ] Migration tested against fresh local instance (`supabase db reset`)
- [ ] Generated types regenerated and committed (`pnpm db:types`)
- [ ] Rollback script included (commented at bottom of migration)
- [ ] No breaking changes to existing columns (or migration is coordinated with deploy)

---

## Test Verification

- [ ] Unit tests added / updated — coverage maintained ≥ 80%
- [ ] Integration tests pass (`pnpm test:integration`)
- [ ] E2E tests pass (`pnpm test:e2e`)
- [ ] Manual testing completed in staging environment

**Test commands run:**
```bash
pnpm test
pnpm type-check
pnpm lint
```

---

## Screenshots *(required for UI changes)*

| Before | After |
|---|---|
| | |

---

## Security Checklist *(required for auth / api / payments changes)*

- [ ] Input validated with Zod at API boundary
- [ ] RLS enforced — cross-user data access impossible
- [ ] No secrets committed (gitleaks scan passes)
- [ ] Rate limiting applied to new AI endpoints
- [ ] New routes added to auth middleware

---

## Deployment Notes

- [ ] No environment variable changes needed
- [ ] New env vars added to `.env.example` and Vercel dashboard
- [ ] No migration needed on deploy
- [ ] Migration runs **before** code deploy (handled by workflow)
- [ ] Feature flag available to disable if needed: <!-- flag name or N/A -->

---

## Reviewer Focus Areas

<!-- What specifically should reviewers pay attention to? -->
-
