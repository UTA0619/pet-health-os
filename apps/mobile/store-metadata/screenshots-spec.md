# Screenshot Specification — Pet Health OS

Screenshots must be captured manually from a physical device or simulator. This document specifies the required screens, dimensions, and formats for App Store and Google Play submission.

---

## iOS Screenshots

### 6.7-inch Display (Required) — iPhone 15 Pro Max
- Resolution: 1290 × 2796 px
- Format: PNG or JPEG (no alpha channel)
- Minimum: 3 screenshots | Maximum: 10 screenshots
- Device frame: optional but recommended for visual consistency

### 5.5-inch Display (Required) — iPhone 8 Plus
- Resolution: 1242 × 2208 px
- Format: PNG or JPEG (no alpha channel)
- Minimum: 3 screenshots | Maximum: 10 screenshots

### iPad Pro 12.9-inch (Required if app supports iPad)
- Resolution: 2048 × 2732 px
- Format: PNG or JPEG (no alpha channel)
- Minimum: 3 screenshots | Maximum: 10 screenshots
- Note: If the app is iPhone-only, this set is not required but is strongly recommended for discoverability on iPads running iPhone apps

---

## Android Screenshots

### Phone (Required)
- Minimum resolution: 1080 × 1920 px
- Recommended resolution: 1440 × 2560 px (QHD)
- Aspect ratio: between 16:9 and 9:16
- Format: PNG or JPEG
- Minimum: 2 screenshots | Maximum: 8 screenshots

### Tablet 7-inch (Optional)
- Minimum resolution: 1080 × 1920 px
- Format: PNG or JPEG

### Tablet 10-inch (Optional)
- Minimum resolution: 1080 × 1920 px
- Format: PNG or JPEG

---

## Required Screens (All Platforms)

Capture the following screens in order. Localize caption overlays for each locale (en-US and ja).

### Screen 1 — Dashboard / Health Score
- Show today's AI health score prominently (e.g., score: 87/100)
- Display the pet name, species icon, and score ring/gauge
- Include the trend indicator (up/down arrow vs. yesterday)
- Suggested caption: "Your pet's health, scored daily by AI"
- Japanese caption: "AIが毎日スコアリング"

### Screen 2 — Camera Health Scan
- Show the camera viewfinder with the pet centered in frame
- Display the AI analysis overlay or result card (coat: good, eyes: clear, etc.)
- Suggested caption: "Point. Scan. Know instantly."
- Japanese caption: "カメラをかざすだけで健康チェック"

### Screen 3 — Daily Log Entry
- Show the log input form with appetite, energy, and behavior fields
- Include a progress indicator (e.g., "Day 14 streak")
- Suggested caption: "60 seconds. Done."
- Japanese caption: "60秒で完了するデイリーログ"

### Screen 4 — Alerts / Anomaly Detection
- Show a push notification example and/or the anomaly detail screen
- Display the alert description (e.g., "Appetite dropped 40% vs. baseline")
- Suggested caption: "Catch illness before it shows"
- Japanese caption: "症状が出る前に異常を検知"

### Screen 5 — Onboarding
- Show the first onboarding screen or pet setup screen
- Clean, welcoming design with the emerald green brand color (#10b981)
- Suggested caption: "Set up in minutes"
- Japanese caption: "数分でセットアップ完了"

### Screen 6 — 30-Day Trend Chart (Recommended)
- Show the health trend graph with 30-day data
- Highlight a stable or improving trend
- Suggested caption: "See the full picture over 30 days"
- Japanese caption: "30日間のトレンドを一目で"

---

## General Requirements

- No device frames required, but must be consistent across all screenshots in a set
- Text and UI must be legible at thumbnail size (screenshots are displayed small in search results)
- Status bar must show clean state: full battery, full signal, no notification badges, time set to 09:41
- No placeholder data — use realistic pet names, realistic scores, realistic log entries
- Brand color (#10b981 emerald green) should be prominent in at least 3 screenshots
- Dark mode and light mode: capture in light mode by default; dark mode variants are optional

---

## Capture Instructions

1. Run the app on a physical device or simulator matching the target resolution
2. Navigate to each required screen
3. Set the status bar time to 09:41 using the simulator or a tool like TopNotch (macOS)
4. Take a screenshot using the device button combination or simulator shortcut (Cmd+S on iOS Simulator)
5. Export screenshots at native resolution without compression
6. Organize files by locale and device size:

```
store-metadata/
  screenshots/
    en-US/
      ios-6.7/
        01-dashboard.png
        02-camera-scan.png
        03-log-entry.png
        04-anomaly-alert.png
        05-onboarding.png
      ios-5.5/
        ...
      ipad-12.9/
        ...
      android-phone/
        ...
    ja/
      ios-6.7/
        ...
```

---

## Notes

- Screenshots are not auto-generated — they must be captured from a running device or simulator
- App Store screenshots are locale-specific; submit Japanese screenshots under the ja locale in App Store Connect
- Google Play allows a single set of screenshots shared across all languages, but localized screenshots are recommended for the primary locale (ja)
- Feature graphic (Android only): 1024 × 500 px banner required for Google Play store listing — design separately
