# Sprint Roadmap — Pet Health OS

## Sprint Structure
- **Sprint 1:** Days 1–7 (MVP Week 1)
- **Sprint 2:** Days 8–14 (MVP Week 2)
- **Sprint 3:** Month 2 (Beta Hardening)

---

## Sprint 1: Foundation + Core AI (Days 1–7)

**Goal:** A user can sign up, add a pet, submit a daily health log, receive an AI health score, and upload a camera photo for analysis.

**Deliverables:**
- [ ] Auth (Google, Apple, Email) working
- [ ] Pet CRUD operational
- [ ] Health log submission working
- [ ] AI health score generated within 3s
- [ ] Camera analysis returning structured findings
- [ ] Basic dashboard showing score + trend
- [ ] Onboarding flow (5 steps) complete
- [ ] Staging environment deployed
- [ ] CI/CD pipeline green

**Issues:** #1, #2, #3, #4, #7, #8, #11, #12, #20, #21, #23, #24, #25, #26, #33, #41, #42, #43, #45

**Priority:** P0 issues only

**Definition of done:**
- New user completes full onboarding in < 5 min
- Health score appears within 3s of log submission
- Camera analysis returns in < 8s
- CI passes on all PRs
- Zero P0 bugs

---

## Sprint 2: Anomaly Detection + Monetization (Days 8–14)

**Goal:** Anomaly alerts firing accurately, Stripe subscriptions live, push notifications working, app observable in production.

**Deliverables:**
- [ ] Per-pet baseline models syncing weekly
- [ ] Statistical anomaly detection (Z-score + IQR) live
- [ ] Push notifications via OneSignal firing for anomalies
- [ ] Stripe Checkout working (Pro subscription)
- [ ] Free tier limits enforced in UI
- [ ] In-app notification center
- [ ] API rate limiting (Upstash Redis)
- [ ] Observability: Sentry + PostHog events
- [ ] Unit test suite at 80% coverage
- [ ] PostHog funnel tracking

**Issues:** #5, #9, #13, #14, #15, #16, #17, #22, #27, #28, #29, #30, #31, #34, #35, #36, #37, #38, #44, #46, #47, #53

**Priority:** P0 + P1

**Definition of done:**
- Anomaly alert fires within 1 min of anomalous log submission
- Stripe Checkout completes and subscription activates
- Push notification delivered to iOS test device
- 80% unit test coverage on AI package
- Zero P0 bugs, < 3 P1 bugs open

---

## Sprint 3: Beta Hardening (Month 2)

**Goal:** First 100 users, NPS > 40, performance hardened, App Store submitted.

**Deliverables:**
- [ ] GDPR compliance (consent, data export, erasure)
- [ ] Account deletion with data purge
- [ ] AI evaluation pipeline in CI
- [ ] Prompt versioning and A/B testing framework
- [ ] E2E test suite (4 critical flows)
- [ ] OWASP security audit complete
- [ ] API penetration testing
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Referral program
- [ ] Admin dashboard
- [ ] PDF health report export (Pro)
- [ ] Database backup strategy
- [ ] App Store + Play Store submission

**Issues:** #6, #10, #18, #19, #32, #39, #40, #48, #49, #50, #51, #52, #54, #55

**Priority:** P1 + P2

**Definition of done:**
- 100 beta users onboarded
- NPS ≥ 40
- 0 critical security findings from pen test
- App Store review submitted
- E2E suite passes in CI
- D7 retention ≥ 20%

---

## Post-MVP Roadmap

### Month 3: Public Launch
- iOS App Store + Google Play release
- Marketing site live
- Referral program active
- PR/media outreach
- 1,000 installs week 1 target

### Month 4–6: AI Optimization
- Fine-tune anomaly detection (precision > 85%)
- Multi-pet household features
- Vet sharing / report export to PDF
- Weekly AI health summary (email)
- Species-specific baseline norms

### Month 6–12: Scale
- Multi-region Supabase (US + EU)
- Vet clinic B2B dashboard
- Pet insurance integration
- Behavioral AI (audio analysis)
- Proprietary model training on Pet Health OS dataset

---

## Key Metrics by Milestone

| Milestone | Activation | D7 Retention | AI Precision | Revenue |
|---|---|---|---|---|
| MVP (Day 14) | > 60% onboarding | N/A | > 65% | $0 |
| Closed Beta | > 70% | > 20% | > 70% | First 10 Pro users |
| Public Launch | > 75% | > 30% | > 75% | $1K MRR |
| Month 6 | > 80% | > 40% | > 85% | $10K MRR |
