# Privacy Policy — Pet Health OS

_Last updated: May 2025_

## What We Collect

| Data | Why | How Long |
|---|---|---|
| Email address | Account identification | Until account deletion |
| Pet profiles (name, species, breed, photo) | Core app functionality | Until deletion |
| Daily health logs | AI health scoring | Until deletion |
| Pet photos | Camera analysis | 90 days (originals), 2 years (processed) |
| AI-generated scores and analyses | Health intelligence | Until deletion |
| Push notification token | Alert delivery | Until notification opt-out |
| Usage analytics (PostHog) | Product improvement | 24 months |
| Error data (Sentry) | Bug fixing | 90 days |
| Payment information | Billing | Managed by Stripe |

## What We Don't Collect

- Location data
- Microphone or camera access outside explicit photo capture
- Your pet's veterinary records (unless you manually enter them)
- Data from children under 13

## How We Use Your Data

- Generate AI health scores and anomaly alerts for your pets
- Send push/email notifications you've enabled
- Process payments for Pro subscriptions
- Improve our AI models (with anonymization and opt-out available)

## AI and OpenAI

Pet photos and health log notes are sent to OpenAI for analysis under an Enterprise agreement. OpenAI does not use your data to train their models. Data is processed in memory and not retained by OpenAI beyond the API call.

## Data Sharing

We do not sell your data. We share data only with:
- **Supabase** — database and auth hosting
- **OpenAI** — AI analysis (Enterprise, no training)
- **Cloudflare** — image storage and CDN
- **Stripe** — payment processing
- **OneSignal** — push notifications
- **Sentry / PostHog** — anonymized error and usage analytics

## Your Rights (GDPR)

- **Access** — request a copy of your data at any time
- **Portability** — export your data as JSON from Settings
- **Erasure** — delete your account and all data within 30 days
- **Correction** — edit your pet profiles and health data at any time
- **Opt-out** — disable analytics tracking in Settings

To exercise your rights: `privacy@pethealthos.com`

## Security

See [SECURITY.md](../../SECURITY.md) for our full security architecture.

## Contact

Moji Inc.  
privacy@pethealthos.com
