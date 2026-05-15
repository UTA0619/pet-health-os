# AI System Architecture — Pet Health OS

## Overview

The AI system has four capabilities, each with its own model, prompt, evaluation pipeline, and guardrails.

| Capability | Model | Trigger | Latency Target |
|---|---|---|---|
| Health Score | GPT-4o-mini + algorithm | On log submission | < 3s |
| Camera Analysis | GPT-4o Vision | On photo upload | < 8s |
| Anomaly Detection | Statistical (Z-score + IQR) | Every 30 min via cron | < 1 min |
| Baseline Modeling | Statistical (rolling window) | Weekly sync Sunday 2am | Background |

---

## 1. Health Score Algorithm

### Composite Scoring

Each of 6 metrics is rated 1–5 by the owner. The score is normalized to 0–100 and weighted:

| Metric | Weight |
|---|---|
| Activity Level | 20% |
| Appetite | 20% |
| Stool Quality | 15% |
| Coat Condition | 15% |
| Eye Clarity | 15% |
| Energy Level | 15% |

**Formula:** `score = Σ (normalized_metric × weight)`  
**Normalization:** `(value - 1) / 4 × 100`

### Trend Direction

Linear regression on last 7 days of overall scores:
- Δ > +5 points → `improving`
- Δ < -5 points → `declining`
- Otherwise → `stable`

### Confidence

```
confidence = (filled_metrics / 6) × min(days_of_history / 14, 1)
```

Confidence < 0.3 → no explanation generated, friendly message shown instead.

### Explanation Generation

GPT-4o-mini generates a 1–2 sentence explanation for scores with weak metrics (< 60/100).  
Prompt version: `health-score-explanation-v1.0`  
Cached per (pet_id, score_date) — regenerated only if score changes by > 5 points.

---

## 2. Camera Analysis (GPT-4o Vision)

### Pipeline

```
Raw image (≤10MB)
    │
    ▼ Client-side resize (1024×1024 max, JPEG 85%, EXIF stripped)
    │
    ▼ Upload to Cloudflare R2 (presigned URL, 15min TTL)
    │
    ▼ analyze-pet-image Edge Function
    │   - Verify ownership
    │   - Rate limit check
    │   - GPT-4o Vision with JSON response_format
    │   - 15s timeout, 3x retry with exponential backoff
    │
    ▼ structured findings JSON
    │
    ▼ Store in camera_analyses
    │
    ▼ If overall_status = concerning/urgent → trigger anomaly check
```

### Structured Output Schema

```typescript
{
  coat_condition: "excellent" | "good" | "fair" | "poor"
  eye_clarity: "clear" | "mild_discharge" | "significant_discharge" | "cloudy"
  posture: "normal" | "slightly_hunched" | "hunched" | "lying_flat"
  mobility: "normal" | "slightly_limited" | "limited" | "unable_to_assess"
  visible_concerns: string[]          // max 5 items
  confidence: number                   // 0.0–1.0
  overall_status: "healthy" | "monitor" | "concerning" | "urgent"
  recommendations: string[]           // max 3 items
  requires_vet_attention: boolean
  vet_urgency: "none" | "routine" | "soon" | "immediate"
}
```

### Confidence Thresholds

| Confidence | Action |
|---|---|
| ≥ 0.7 | Normal display |
| 0.4–0.7 | Display with "uncertain" badge |
| < 0.4 | Flag for human review queue |

### Guardrails

- System prompt explicitly prohibits diagnoses
- "Consult your vet" is the only medical CTA
- Disclaimer appended to all outputs
- `requires_vet_attention` field triggers vet referral modal
- Human review queue drains within 4h

---

## 3. Anomaly Detection

### Algorithm

Statistical detection using per-pet behavioral baselines:

**Z-score:** `z = |value - baseline_mean| / baseline_std`  
**IQR outlier:** `value < Q1 - 1.5×IQR` or `value > Q3 + 1.5×IQR`

**Severity classification:**

| Condition | Severity |
|---|---|
| Z-score only ≥ 2.5σ | Mild |
| Both Z-score AND IQR outlier | Moderate |
| Z-score ≥ 3.5σ | Severe |

**Deduplication:** Same anomaly type per pet suppressed within 24h.

**Cold start:** < 14 days of data → no alerts fired (baselines not mature enough).

### Alert routing

```
Anomaly detected
    │
    ├── severity = mild → in-app notification only
    ├── severity = moderate → push notification + in-app
    └── severity = severe → push notification + in-app + email
```

---

## 4. Baseline Modeling

### Weekly Sync (Sunday 2am)

For each active pet, for each metric:
1. Fetch last 30 days of health logs
2. Extract non-null values for each metric
3. Compute: mean, std_dev, min, max, Q1, Q3
4. Upsert to `pet_baselines`

**Cold start norms** (when < 14 days of data): use breed/species/age population defaults from `packages/ai/src/data/population-norms.json`

---

## Prompt Versioning

All prompts are stored as TypeScript constants in `packages/ai/src/prompts/`:

```
packages/ai/src/prompts/
├── health-score-explanation.ts      # v1.0
├── camera-analysis.ts               # v1.0
└── index.ts                         # exports all with versions
```

Every OpenAI call logs:
- `prompt_version`
- `model`
- `input_tokens`
- `output_tokens`
- `latency_ms`
- `pet_id` (masked)

---

## Evaluation Pipeline

### Ground Truth Dataset

50 anonymized pet health cases with:
- 30 days of health logs
- Known anomaly events (vet-verified)
- Camera photo assessments (vet-graded)

### Metrics

| Metric | Target | Block merge if |
|---|---|---|
| Anomaly precision | > 70% | < 65% |
| Anomaly recall | > 60% | < 55% |
| Score MAE vs vet | < 10 pts | > 15 pts |
| Camera F1 | > 65% | < 60% |

Eval runs on every PR that touches `packages/ai/**` or `supabase/functions/`. Results posted as PR comment.

---

## AI Rate Limits

| Endpoint | Free | Pro |
|---|---|---|
| Camera analyses | 3/day | 50/day |
| Health score generation | Unlimited | Unlimited |
| Manual anomaly check | 5/day | 20/day |

Rate limits enforced via Upstash Redis (sliding window, per user_id + endpoint).
