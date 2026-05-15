# API Reference — Pet Health OS v1

Base URL: `https://pethealthos.com/api/v1`

All endpoints require `Authorization: Bearer <supabase_jwt>` unless noted.

---

## Authentication

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/health` | GET | None | Health check — returns service status |

---

## Pets

### `GET /pets`
Returns all active pets for the authenticated user.

**Response 200:**
```json
{
  "pets": [
    {
      "id": "uuid",
      "name": "Buddy",
      "species": "dog",
      "breed": "Golden Retriever",
      "date_of_birth": "2020-03-15",
      "weight_kg": 28.5,
      "photo_url": "https://images.pethealthos.com/...",
      "latest_score": 87.4,
      "latest_score_date": "2025-05-15"
    }
  ]
}
```

### `POST /pets`
Create a new pet profile.

**Request body:**
```json
{
  "name": "string (required)",
  "species": "dog | cat | rabbit | bird | reptile | other",
  "breed": "string?",
  "sex": "male | female | unknown",
  "date_of_birth": "YYYY-MM-DD?",
  "weight_kg": "number?"
}
```

**Response 201:** Created pet object.

### `PATCH /pets/:id`
Update pet profile fields.

### `DELETE /pets/:id`
Soft-delete a pet (sets `is_active = false`).

---

## Health Logs

### `GET /pets/:petId/health-logs`
Returns health logs for a pet.

**Query params:** `?from=YYYY-MM-DD&to=YYYY-MM-DD&limit=30`

### `POST /pets/:petId/health-logs`
Submit a daily health log. Triggers health score generation.

**Request body:**
```json
{
  "log_date": "YYYY-MM-DD (defaults to today)",
  "activity_level": "1-5 (required)",
  "appetite": "1-5 (required)",
  "stool_quality": "1-5?",
  "coat_condition": "1-5?",
  "eye_clarity": "1-5?",
  "energy_level": "1-5?",
  "notes": "string? (max 500 chars)"
}
```

**Response 201:**
```json
{
  "log": { "...health log object..." },
  "score_status": "calculating"
}
```

Score is computed asynchronously. Subscribe to Supabase Realtime channel `pet:{petId}` for `health_score_updated` event.

---

## Health Scores

### `GET /pets/:petId/health-scores`
Returns historical health scores.

**Query params:** `?days=30`

**Response 200:**
```json
{
  "scores": [
    {
      "score_date": "2025-05-15",
      "overall_score": 87.4,
      "component_scores": {
        "activity_level": 90,
        "appetite": 80,
        "stool_quality": 100,
        "coat_condition": 85,
        "eye_clarity": 95,
        "energy_level": 75
      },
      "trend_direction": "improving",
      "confidence": 0.92,
      "explanation": "Buddy is doing well today! Energy is slightly lower than usual — consider if they had a more active day yesterday."
    }
  ]
}
```

---

## Camera Analysis

### `POST /upload-url`
Request a presigned R2 upload URL.

**Request body:** `{ "pet_id": "uuid", "content_type": "image/jpeg" }`

**Response 200:** `{ "upload_url": "...", "cdn_url": "...", "expires_in": 900 }`

### `POST /pets/:petId/analyze`
Submit a camera analysis request.

**Request body:** `{ "image_url": "R2 URL from upload-url endpoint" }`

**Response 200:**
```json
{
  "analysis": {
    "overall_status": "healthy",
    "confidence": 0.82,
    "findings": { "..." },
    "recommendations": ["Continue regular brushing", "Great coat condition!"]
  },
  "disclaimer": "This analysis is AI-generated and not a veterinary diagnosis..."
}
```

**Rate limits:** 3/day (free), 50/day (pro). Returns 429 with upgrade prompt when exceeded.

---

## Anomaly Detections

### `GET /pets/:petId/anomalies`
Returns anomaly history.

**Query params:** `?resolved=false&limit=10`

### `PATCH /pets/:petId/anomalies/:id`
Mark anomaly as resolved or false positive.

**Request body:** `{ "resolved": true }` or `{ "false_positive": true }`

---

## Subscriptions

### `GET /subscription`
Returns current subscription status and features.

### `POST /subscription/checkout`
Create a Stripe Checkout session.

**Request body:** `{ "price_id": "stripe_price_id", "success_url": "...", "cancel_url": "..." }`

**Response 200:** `{ "checkout_url": "https://checkout.stripe.com/..." }`

### `POST /subscription/portal`
Create a Stripe Customer Portal session for billing management.

**Response 200:** `{ "portal_url": "https://billing.stripe.com/..." }`

---

## Webhooks (internal)

### `POST /webhooks/stripe`
Handles Stripe webhook events. Validates signature.

### `POST /api/cron/run-anomaly-detection`
Vercel Cron endpoint — requires `x-cron-secret` header.

### `POST /api/cron/generate-daily-health-score`
Vercel Cron — generates scores for all pets with a log submitted today.

### `POST /api/cron/send-health-alerts`
Vercel Cron — sends pending anomaly alerts.

### `POST /api/cron/sync-baseline-models`
Vercel Cron — recomputes baselines for all active pets.

---

## Error Codes

| Code | Meaning |
|---|---|
| 400 | Invalid request body (Zod validation failed) |
| 401 | Missing or invalid JWT |
| 403 | Access denied (RLS violation or ownership check) |
| 404 | Resource not found |
| 429 | Rate limit exceeded |
| 500 | Internal server error (logged in Sentry) |

Error response shape:
```json
{ "error": "Human-readable message", "code": "MACHINE_CODE" }
```
