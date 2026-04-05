# API Settings Manager Implementation Plan

## Overview
Create a dedicated management interface to update API keys and configuration settings at runtime. This will replace the reliance on static `.env` file updates which can cause server restarts and are difficult to manage in production environments.

## Project Type
**WEB** (Next.js)

## Success Criteria
- [ ] Users can view and edit all API keys from a secure dashboard.
- [ ] Settings persist across server restarts without modifying the `.env` file directly.
- [ ] The system prioritizes manual overrides over `.env` defaults.
- [ ] The UI follows high-end design principles (no purple, vibrant accents, dark mode).
- [ ] All existing API routes are updated to use the new settings provider.

## Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Styling**: Vanilla CSS / Tailwind (following existing project patterns)
- **Icons**: Lucide React
- **Storage**: JSON-based persistent storage (`src/data/settings.json`)
- **State Management**: React Hooks (useState, useEffect)

## File Structure
- `src/lib/settings.ts`: Utility for reading/writing settings with fallback to `process.env`.
- `src/data/settings.json`: Storage for the overrides.
- `src/app/api/config/settings/route.ts`: API endpoints (GET/POST) for settings management.
- `src/app/config/settings/page.tsx`: The new management UI.

## Task Breakdown

### Phase 1: Foundation (Backend & Lib)
| Task ID | Name | Agent | Skill | Priority | Dependencies | INPUT → OUTPUT → VERIFY |
|---------|------|-------|-------|----------|--------------|-------------------------|
| F1 | Create Settings Utility | `backend-specialist` | `clean-code` | P0 | None | Create `src/lib/settings.ts` with `getSetting(key)` and `updateSettings(data)` |
| F2 | Initialize Storage | `database-architect` | `clean-code` | P0 | F1 | Create `src/data/settings.json` (empty object initially) |
| F3 | Create Settings API | `backend-specialist` | `api-patterns` | P1 | F1 | Create `src/app/api/config/settings/route.ts` (GET/POST) |

### Phase 2: Refactoring (Core Logic)
| Task ID | Name | Agent | Skill | Priority | Dependencies | INPUT → OUTPUT → VERIFY |
|---------|------|-------|-------|----------|--------------|-------------------------|
| R1 | Update API Routes | `backend-specialist` | `clean-code` | P1 | F1 | Replace `process.env.*` with `getSetting('*')` in all identified routes |

### Phase 3: UI Implementation (Frontend)
| Task ID | Name | Agent | Skill | Priority | Dependencies | INPUT → OUTPUT → VERIFY |
|---------|------|-------|-------|----------|--------------|-------------------------|
| U1 | Design Settings Page | `frontend-specialist` | `frontend-design` | P2 | F3 | Create `src/app/config/settings/page.tsx` with vibrant, maskable inputs |
| U2 | Implement Save Logic | `frontend-specialist` | `frontend-design` | P2 | U1 | Connect the UI forms to the Settings API |

### Phase X: Verification
- [ ] Execute `python .agent/scripts/verify_all.py .`
- [ ] Manual test: Update `ODDSSCANNER_API_KEY` via UI and verify it's used in the next fetch.
- [ ] Verify no server restart occurs when updating values.
- [ ] Check Purple Ban compliance (no hex `#800080`, etc.).

## ✅ PHASE X COMPLETE
- Status: [Pending]
