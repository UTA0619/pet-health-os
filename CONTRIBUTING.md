# Contributing to Pet Health OS

> **Philosophy:** Ship fast, never break trust. Pet health data is sensitive and our AI outputs inform real decisions — correctness and safety come before speed.

---

## Branch Strategy

| Branch | Purpose |
|---|---|
| `main` | Production — protected, requires CI + review |
| `staging` | Pre-production — auto-deploys to staging environment |
| `feature/*` | New features |
| `fix/*` | Bug fixes |
| `infra/*` | Infrastructure and CI/CD changes |
| `chore/*` | Dependency updates, refactoring |
| `ai/*` | AI model, prompt, or evaluation changes |

---

## Commit Conventions

Format: `type(scope): description`

**Types:** `feat` · `fix` · `perf` · `refactor` · `style` · `test` · `docs` · `chore` · `ci` · `ai`

**Scopes:** `auth` · `ai` · `db` · `camera` · `score` · `anomaly` · `notifications` · `payments` · `pets` · `onboarding` · `infra`

**Examples:**
```
feat(score): add trend direction computation to health score algorithm
fix(camera): handle image analysis timeout with graceful fallback
ai(anomaly): tune Z-score threshold from 2.0 to 2.5 to reduce false positives
perf(db): add composite index on (pet_id, log_date) for health log queries
```

---

## Pull Request Requirements

1. **Link an issue** — every PR must close at least one issue
2. **Use the PR template** — fill every section
3. **Minimum 1 reviewer** — no self-merges
4. **Screenshots for UI changes** — include before/after
5. **AI context for prompt changes** — include eval results
6. **Green CI** — all checks must pass before merge

### PR Size Guidelines

| Size | Lines Changed | Expectation |
|---|---|---|
| XS | < 50 | Review in < 30 min |
| S | 50–200 | Review in < 2h |
| M | 200–500 | Review in < 4h |
| L | 500–1000 | Prefer splitting; justify in description |
| XL | > 1000 | Requires explicit CTO approval |

### Review SLAs

| Priority | SLA |
|---|---|
| P0 (Critical / Security) | 2 hours |
| P1 (Standard feature) | 24 hours |
| P2 (Chore / Docs) | 48 hours |

---

## Code Standards

### TypeScript
- Strict mode enabled — no `any` without explicit justification comment
- Interfaces over type aliases for object shapes
- Zod validation at all system boundaries (API input, Edge Function input)
- No `!` non-null assertions — handle null explicitly
- Prefer `Result<T, E>` pattern over throwing in business logic

### React
- Functional components only
- Custom hooks for all stateful logic > 20 lines
- Framer Motion for web animations, Reanimated for mobile
- Respect `prefers-reduced-motion` on all animations
- 44px minimum touch targets
- Loading skeletons on all data-fetching views

### Supabase
- **Every table must have RLS enabled** — no exceptions
- Parameterized queries only — never string interpolation in SQL
- Test RLS policies in integration tests (user A cannot access user B's data)
- Migration files: never edit in place — always new numbered file
- Generated types must be committed (`supabase gen types typescript`)

### AI / Prompts
- All prompts stored in `packages/ai/src/prompts/` as versioned constants
- Prompt version logged with every OpenAI call
- Every AI call has a timeout (15s) and a fallback response
- Batch embeddings — never one at a time
- Wrap user content in XML isolation: `<user_content>...</user_content>`
- No medical diagnoses — "consult your vet" is the only medical CTA
- Run eval harness on any prompt change; include results in PR description

---

## Testing Standards

| Type | Tool | Target |
|---|---|---|
| Unit | Vitest | 80% line coverage on `packages/ai` and `supabase/functions` |
| Integration | Supabase local | RLS policies, triggers, migration idempotency |
| E2E | Playwright | 4 critical user flows |
| AI Eval | Custom harness | Precision >70% on anomaly detection |

```bash
pnpm test               # Unit tests
pnpm test:coverage      # Unit tests + coverage report
pnpm test:integration   # Supabase local integration tests
pnpm test:e2e           # Playwright E2E suite
pnpm test:ai            # AI evaluation harness
```

---

## Database Migration Rules

1. Always create a new numbered file: `supabase/migrations/NNN_description.sql`
2. Never edit existing migration files
3. Include RLS policies in the same migration file as the table
4. Test migration against a fresh Supabase local instance
5. Include a rollback section (commented) at the bottom of each migration
6. Generated types must be regenerated and committed after every migration

```bash
supabase db push                          # Apply migrations
supabase gen types typescript > packages/database/src/types.ts
```

---

## Security Requirements

- Never commit secrets — use `.env.local` (gitignored) for local dev
- Validate all user input with Zod at API boundaries
- Sanitize all text sent to AI: strip markdown, limit length, XML-isolate
- Rate limit all AI endpoints (see `packages/ai/src/rateLimit.ts`)
- Report security vulnerabilities via `security@pethealthos.com`, not GitHub issues

---

## Performance Budgets

| Metric | Budget |
|---|---|
| First Contentful Paint | < 1.5s |
| AI score response | < 3s P95 |
| Camera analysis | < 8s P95 |
| DB queries | < 100ms P99 |
| Initial JS bundle | < 200KB gzipped |

Regressions against these budgets block merge.

---

## Getting Help

- **Architecture questions** → open a `spike` issue
- **Security concerns** → email `security@pethealthos.com`
- **General questions** → `#engineering` Slack channel
