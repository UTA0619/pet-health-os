# Incident Response Runbook — Pet Health OS

## Severity Levels

| Severity | Definition | Response Time | Examples |
|---|---|---|---|
| P0 | Complete outage or data loss | 15 min | App down, DB unreachable, security breach |
| P1 | Core feature broken for all users | 1 hour | AI scoring failing, auth broken, Stripe down |
| P2 | Feature degraded for some users | 4 hours | Slow AI responses, push notifications failing |
| P3 | Minor issue, workaround exists | 24 hours | UI bug, slow dashboard load |

---

## On-Call

**PagerDuty rotation:** Engineering team, weekly rotation  
**Escalation:** On-call → CTO (if no response in 15 min)  
**Slack channel:** `#incidents`

---

## P0 Response Checklist

```
□ 1. Acknowledge in PagerDuty (stop the noise)
□ 2. Post in #incidents: "Incident declared: [description]. I am IC."
□ 3. Check Vercel deployment status (vercel.com/dashboard)
□ 4. Check Supabase status (status.supabase.com)
□ 5. Check Sentry for error spike
□ 6. Check health endpoint: curl https://pethealthos.com/api/health
□ 7. Identify blast radius (how many users affected?)
□ 8. Consider rollback if recent deploy is suspect (see Rollback section)
□ 9. Post user-facing status update (status page / in-app banner)
□ 10. Resolve or escalate with findings every 30 min
```

---

## Rollback Procedures

### Vercel Rollback (< 2 min)
```bash
# List recent deployments
vercel ls --prod

# Rollback to previous deployment
vercel rollback [deployment-url] --scope [team-id]
```

### Database Migration Rollback
Each migration file has a commented rollback section at the bottom.

```bash
# Connect to Supabase DB
supabase db connect --project-ref [project-ref]

# Execute rollback SQL (from migration file comments)
```

### Feature Flag Disable (< 30 seconds)
```bash
# Disable AI processing without deploy
vercel env add FEATURE_AI_ENABLED false --env production --scope [team-id]
# Trigger re-deploy or use Edge Config for instant effect
```

---

## Common Failure Modes

### AI Scoring Fails
**Symptoms:** Score shows "calculating..." indefinitely  
**Check:** Sentry for `generate-health-score` errors. OpenAI API status.  
**Fix:** If OpenAI down → feature flag `FEATURE_AI_ENABLED=false`. Score computation degrades gracefully to "unavailable."

### Camera Analysis Timeout
**Symptoms:** Analysis never completes, spinner indefinite  
**Check:** Edge Function logs in Supabase dashboard. GPT-4o Vision latency.  
**Fix:** Retry usually self-heals. If persistent → rate limit more aggressively, add queue.

### Stripe Webhooks Failing
**Symptoms:** Payments succeed but subscriptions don't activate  
**Check:** Stripe webhook dashboard → event delivery status.  
**Fix:** Stripe will retry for 72h. Check webhook handler logs in Sentry. Manual subscription activation via Supabase dashboard if urgent.

### Supabase Realtime Disconnects
**Symptoms:** Health scores don't update without refresh  
**Check:** Supabase Realtime status. Client console errors.  
**Fix:** Graceful degradation — client polls every 10s if Realtime disconnected.

---

## Post-Incident Review

Within 48h of every P0/P1:
1. Timeline of events
2. Root cause
3. Customer impact
4. What we did well
5. What we'd do differently
6. Action items with owners and due dates

Template: `docs/operations/postmortem-template.md`
