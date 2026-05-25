# Content Rating Questionnaire — Pet Health OS

Answers for App Store (Apple) and Google Play (Google) content rating submissions. Complete these questionnaires in their respective developer consoles using the answers below.

---

## App Store Connect — Content Descriptions

Navigate to: App Store Connect > Your App > App Information > Content Descriptions

| Category | Level | Notes |
|---|---|---|
| Alcohol, Tobacco, or Drug Use or References | None | Not present |
| Contests | None | No contests or sweepstakes |
| Gambling and Contests | None | Not present |
| Horror/Fear Themes | None | Not present |
| Mature/Suggestive Themes | None | Not present |
| Medical/Treatment Information | Infrequent/Mild | App provides AI-generated pet health insights |
| Profanity or Crude Humor | None | Not present |
| Realistic Violence | None | Not present |
| Sexual Content or Nudity | None | Not present |
| Simulated Gambling | None | Not present |
| Cartoon or Fantasy Violence | None | Not present |

**Resulting Age Rating: 4+**

The Medical/Treatment Information flag (Infrequent/Mild) is required because the app displays AI-generated health scores and insights. This does not affect the 4+ rating — it only requires the appropriate disclaimer (already included in the app and store description).

---

## App Store Connect — Additional Flags

| Question | Answer |
|---|---|
| Does the app contain ads? | No |
| Is the app made for kids? | No |
| Does the app use encryption? | Yes — AES-256 for data at rest and TLS 1.3 in transit. This is standard, exempt encryption (data protection). File the annual self-classification report with BIS if distributing outside the US. |
| Does the app include in-app purchases? | Specify based on your monetization model |

---

## Google Play — Content Rating Questionnaire (IARC)

Navigate to: Google Play Console > Your App > Policy > App Content > Content Rating

### Step 1: App Category
Select: **Health & Fitness**

### Step 2: Questionnaire Answers

**Violence**
- Does your app contain realistic depictions of violence toward humans or animals? **No**
- Does your app contain cartoon or fantasy violence? **No**

**Sexual Content**
- Does your app contain nudity or sexual content? **No**
- Does your app contain references to sexual topics? **No**

**Language**
- Does your app contain profanity or crude humor? **No**

**Controlled Substances**
- Does your app contain references to alcohol, tobacco, or drugs? **No**

**Gambling**
- Does your app contain gambling or simulated gambling? **No**
- Does your app contain loot boxes or similar mechanics? **No**

**User Interaction and Sharing**
- Does your app allow users to interact with each other? **No** (health logs are private to the user)
- Does your app allow users to share user-generated content publicly? **No**
- Does your app include social networking features? **No**

**Location**
- Does your app collect precise location data? **No** (the app does not use GPS or location services)

**Personal Information**
- Does your app collect personal information from users? **Yes** — email address for account creation, and pet health log data. All data is private to the user and encrypted.

**Ads**
- Does your app contain advertising? **No**

**Medical Information**
- Does your app provide medical information or health data? **Yes** — the app provides AI-generated pet health scores and insights. A disclaimer is displayed within the app stating that this is not a substitute for veterinary care.

**Step 3: Resulting Rating**

| Region | Rating |
|---|---|
| ESRB (US/Canada) | Everyone |
| PEGI (Europe) | 3 |
| USK (Germany) | 0 |
| CERO (Japan) | A (All Ages) |
| ClassInd (Brazil) | Livre |
| GRAC (South Korea) | All |
| OFLC (Australia/NZ) | G |

**Google Play overall rating: Everyone**

---

## App Category

| Store | Category | Sub-category |
|---|---|---|
| App Store | Health & Fitness | — |
| Google Play | Health & Fitness | — |

---

## User-Generated Content Summary

The app allows users to create private daily health log entries for their pets. This content:

- Is visible only to the account holder (not publicly shared or visible to other users)
- Does not include social networking, comments, or public forums
- Is not moderated by the app — it is private journal-style data entry
- Does not constitute a social platform or user-interaction feature

Because the UGC is entirely private and not shareable between users, no additional UGC content rating flags apply.

---

## Summary

| Attribute | iOS | Android |
|---|---|---|
| Age Rating | 4+ | Everyone |
| Violence | None | None |
| Sexual Content | None | None |
| Gambling | None | None |
| Ads | No | No |
| Social Networking | No | No |
| UGC | Private logs only | Private logs only |
| Medical Information | Infrequent/Mild (flagged) | Yes (flagged, disclaimer shown) |
| Encryption | Yes (standard/exempt) | Yes (standard/exempt) |
| Category | Health & Fitness | Health & Fitness |
