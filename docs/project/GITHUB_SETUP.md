# GitHub Setup Guide — Pet Health OS

Run `bash scripts/setup-github.sh` to create all labels and milestones automatically.

## Labels (42 total)

### Priority
| Label | Color | Description |
|---|---|---|
| `P0: Critical` | `#FF0000` | System down, data loss, security breach |
| `P1: High` | `#FF6B35` | Blocking core user flows |
| `P2: Medium` | `#FFB347` | Important but not blocking |
| `P3: Low` | `#90EE90` | Nice to have |

### Bug Severity
| Label | Color | Description |
|---|---|---|
| `bug: critical` | `#CC0000` | App crash, data corruption |
| `bug: major` | `#FF4500` | Major feature broken |
| `bug: minor` | `#FFA07A` | Degraded experience |
| `bug: cosmetic` | `#FFDAB9` | Visual only |

### Domain
| Label | Color | Description |
|---|---|---|
| `ai` | `#8B5CF6` | AI/ML model tasks |
| `frontend` | `#3B82F6` | Web/mobile UI |
| `backend` | `#059669` | API, Edge Functions |
| `database` | `#D97706` | Schema, migrations |
| `infra` | `#6B7280` | CI/CD, deployment |
| `ux` | `#EC4899` | User experience |
| `auth` | `#DC2626` | Authentication |
| `security` | `#991B1B` | Security tasks |
| `camera` | `#7C3AED` | Camera pipeline |
| `notifications` | `#0891B2` | Push/email/in-app |
| `analytics` | `#0369A1` | Analytics |
| `payments` | `#065F46` | Stripe, billing |
| `api` | `#1D4ED8` | REST API |
| `mobile` | `#B45309` | iOS/Android |

### Status
| Label | Color |
|---|---|
| `blocked` | `#DC2626` |
| `needs-triage` | `#6B7280` |
| `needs-design` | `#DB2777` |
| `needs-review` | `#7C3AED` |
| `in-progress` | `#2563EB` |
| `ready` | `#059669` |

### Type
| Label | Color |
|---|---|
| `enhancement` | `#A78BFA` |
| `bug` | `#F87171` |
| `epic` | `#F59E0B` |
| `task` | `#93C5FD` |
| `spike` | `#C4B5FD` |
| `docs` | `#9CA3AF` |
| `good first issue` | `#7EE787` |

### Quality
| Label | Color |
|---|---|
| `technical-debt` | `#92400E` |
| `performance` | `#0C4A6E` |
| `regression` | `#7F1D1D` |

### Sprint / Release
| Label | Color |
|---|---|
| `sprint-1` | `#BFDBFE` |
| `sprint-2` | `#BBF7D0` |
| `sprint-3` | `#FEF3C7` |
| `mvp` | `#FDE68A` |
| `beta` | `#A7F3D0` |
| `v1.0` | `#FBCFE8` |

## Milestones

| Milestone | Due | Description |
|---|---|---|
| M0: Foundation | Day 3 | Repo, CI/CD, DB schema, auth, staging |
| M1: MVP Week 1 | Day 7 | Core logging, AI score, camera scan |
| M2: MVP Week 2 | Day 14 | Anomaly detection, subscriptions, notifications |
| M3: Closed Beta | Month 2 | 100 users, NPS > 40, performance hardened |
| M4: Public Launch | Month 3 | App Store, marketing site, viral loop |
| M5: AI Optimization | Month 4+ | Precision > 85%, vet integration |

## Project Board Columns

1. Icebox
2. Backlog
3. Ready
4. In Progress (WIP limit: 3)
5. In Review
6. QA
7. Done

## Branch Protection (apply to `main`)

- Require CI to pass
- Require 1 approving review
- Dismiss stale reviews on new commits
- Require conversation resolution
- No force pushes
