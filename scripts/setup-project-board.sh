#!/usr/bin/env bash
# ============================================================
# Pet Health OS — GitHub Project Board Setup
# Creates the engineering project board with columns
# Usage: bash scripts/setup-project-board.sh [owner]
# ============================================================

set -euo pipefail

ORG="${1:-moji-inc}"
PROJECT_TITLE="Pet Health OS — Engineering"

echo "Creating GitHub Project for org: $ORG"

# Create project
PROJECT_URL=$(gh project create \
  --owner "$ORG" \
  --title "$PROJECT_TITLE" \
  --format json | jq -r '.url')

PROJECT_NUMBER=$(echo "$PROJECT_URL" | grep -o '[0-9]*$')

echo "Project created: $PROJECT_URL"

# The default project has a Status field. We'll configure the options.
# Note: gh project field-list / item management requires additional gh project commands

echo ""
echo "✅ Project board created: $PROJECT_URL"
echo ""
echo "Manual steps to complete in GitHub UI:"
echo "  1. Configure Status field with columns:"
echo "     Icebox → Backlog → Ready → In Progress → In Review → QA → Done"
echo "  2. Set WIP limit on 'In Progress': 3 items"
echo "  3. Add Automation rules:"
echo "     - Issue assigned → In Progress"
echo "     - PR opened referencing issue → In Review"
echo "     - PR merged → QA"
echo "     - Issue closed → Done"
echo "  4. Create views:"
echo "     - By Sprint (group by sprint-1/sprint-2/sprint-3 label)"
echo "     - By Domain (group by domain label)"
echo "     - By Priority (sort by P0→P3)"
echo "     - By Milestone"
echo "  5. Link all existing issues to this project"
echo "     gh project item-add $PROJECT_NUMBER --owner $ORG --url <issue-url>"
echo ""
echo "Project URL: $PROJECT_URL"
