#!/usr/bin/env bash
# ============================================================
# Pet Health OS — GitHub Setup Script
# Creates all labels and milestones via gh CLI
# Usage: bash scripts/setup-github.sh [owner/repo]
# ============================================================

set -euo pipefail

REPO="${1:-$(gh repo view --json nameWithOwner -q .nameWithOwner)}"
echo "Setting up GitHub project for: $REPO"

# ── Labels ───────────────────────────────────────────────────
echo ""
echo "Creating labels..."

create_label() {
  local name="$1" color="$2" description="$3"
  gh label create "$name" --color "$color" --description "$description" --repo "$REPO" --force
}

# Priority
create_label "P0: Critical"   "FF0000" "System down, data loss, security breach"
create_label "P1: High"       "FF6B35" "Blocking core user flows"
create_label "P2: Medium"     "FFB347" "Important but not blocking"
create_label "P3: Low"        "90EE90" "Nice to have"

# Bug severity
create_label "bug: critical"  "CC0000" "App crash, data corruption"
create_label "bug: major"     "FF4500" "Major feature broken"
create_label "bug: minor"     "FFA07A" "Degraded experience"
create_label "bug: cosmetic"  "FFDAB9" "Visual only"

# Domain
create_label "ai"             "8B5CF6" "AI/ML model tasks"
create_label "frontend"       "3B82F6" "Web/mobile UI"
create_label "backend"        "059669" "API, Edge Functions, server logic"
create_label "database"       "D97706" "Schema, migrations, queries"
create_label "infra"          "6B7280" "CI/CD, deployment, monitoring"
create_label "ux"             "EC4899" "User experience, design"
create_label "auth"           "DC2626" "Authentication and authorization"
create_label "security"       "991B1B" "Security tasks"
create_label "camera"         "7C3AED" "Camera pipeline, image processing"
create_label "notifications"  "0891B2" "Push/email/in-app notifications"
create_label "analytics"      "0369A1" "PostHog, dashboards"
create_label "payments"       "065F46" "Stripe, subscriptions, billing"
create_label "api"            "1D4ED8" "REST API design and implementation"
create_label "mobile"         "B45309" "iOS/Android specific"

# Status
create_label "blocked"        "DC2626" "Blocked by dependency or decision"
create_label "needs-triage"   "6B7280" "Needs prioritization"
create_label "needs-design"   "DB2777" "Waiting on design"
create_label "needs-review"   "7C3AED" "PR or approach review needed"
create_label "in-progress"    "2563EB" "Actively being worked on"
create_label "ready"          "059669" "Ready to pick up"

# Type
create_label "enhancement"    "A78BFA" "New feature or improvement"
create_label "bug"            "F87171" "Something is broken"
create_label "epic"           "F59E0B" "Large multi-issue initiative"
create_label "task"           "93C5FD" "Engineering task or chore"
create_label "spike"          "C4B5FD" "Research or investigation"
create_label "docs"           "9CA3AF" "Documentation only"
create_label "good first issue" "7EE787" "Good for newcomers"

# Quality
create_label "technical-debt" "92400E" "Code quality improvement"
create_label "performance"    "0C4A6E" "Speed or efficiency improvement"
create_label "regression"     "7F1D1D" "Previously working, now broken"

# Sprint
create_label "sprint-1"       "BFDBFE" "Sprint 1 — Days 1-7"
create_label "sprint-2"       "BBF7D0" "Sprint 2 — Days 8-14"
create_label "sprint-3"       "FEF3C7" "Sprint 3 — Month 2"

# Release
create_label "mvp"            "FDE68A" "Required for MVP launch"
create_label "beta"           "A7F3D0" "Required for closed beta"
create_label "v1.0"           "FBCFE8" "Required for public v1.0 launch"

echo "✅ Labels created (42 total)"

# ── Milestones ───────────────────────────────────────────────
echo ""
echo "Creating milestones..."

create_milestone() {
  local title="$1" description="$2" due="$3"
  gh api "repos/$REPO/milestones" \
    --method POST \
    --field "title=$title" \
    --field "description=$description" \
    --field "due_on=${due}T00:00:00Z" \
    --silent || echo "Milestone '$title' may already exist — skipping"
}

TODAY=$(date +%Y-%m-%d)
DAY3=$(date -v+3d +%Y-%m-%d 2>/dev/null || date -d "+3 days" +%Y-%m-%d)
DAY7=$(date -v+7d +%Y-%m-%d 2>/dev/null || date -d "+7 days" +%Y-%m-%d)
DAY14=$(date -v+14d +%Y-%m-%d 2>/dev/null || date -d "+14 days" +%Y-%m-%d)
MONTH2=$(date -v+45d +%Y-%m-%d 2>/dev/null || date -d "+45 days" +%Y-%m-%d)
MONTH3=$(date -v+90d +%Y-%m-%d 2>/dev/null || date -d "+90 days" +%Y-%m-%d)
MONTH4=$(date -v+120d +%Y-%m-%d 2>/dev/null || date -d "+120 days" +%Y-%m-%d)

create_milestone "M0: Foundation" "Repo, CI/CD, DB schema, auth, staging deployed" "$DAY3"
create_milestone "M1: MVP Week 1" "Core logging, AI score, camera scan, basic dashboard" "$DAY7"
create_milestone "M2: MVP Week 2" "Anomaly detection, subscriptions, notifications" "$DAY14"
create_milestone "M3: Closed Beta" "100 users, NPS >40, performance hardened" "$MONTH2"
create_milestone "M4: Public Launch" "App Store, marketing site, viral loop" "$MONTH3"
create_milestone "M5: AI Optimization" "Precision >85%, vet integration, multi-region" "$MONTH4"

echo "✅ Milestones created (6 total)"
echo ""
echo "🎉 GitHub setup complete! Now run: bash scripts/seed-issues.sh"
