# AI_CONTEXT.md — shared context for Claude Code + Gemini CLI

## Product
**Dima OS Dashboard** — mobile‑first static dashboard (no backend) for quick access to Dima's personal OS links.

## Stack
- Vite + React + TypeScript
- Tailwind CSS (v4)
- Deployed via GitHub Pages (Actions workflow in `.github/workflows/deploy.yml`)

## Key UX requirements
- iOS-like card UI
- Dark mode toggle (persisted)
- Search filter over link cards
- Quick stats section (date/time, weather placeholder, trading guardrails)
- Floating "Quick Add" sheet with Telegram command templates:
  - `inbox:`
  - `buy:`
  - `trade:`
  - `debrief:`

## Configuration
Links live in: `src/data/links.ts`

## Current status (Feb 10, 2026)
- **Phase 1: Critical Bug Fixes — COMPLETED**
  - Fixed timezone bugs in date comparisons (rules.ts, HomePage.tsx)
  - Added AgentTask/TaskStatus types to AppData interface
  - Fixed double-save issue in TeamPage.tsx
  - Fixed month overflow in billNextDueDate (February 31 → Feb 28/29)
  - Fixed habit autofill to clear when conditions not met
  - Removed metric protection in checkin modal (now authoritative)
  - Extracted shared uid() utility
  - Fixed seeded demo bills with realistic amounts ($1500, $150, $85)
  - Deleted 6 orphaned files (QuickStats, QuickAddSheet, LinkCard, LinkSection, SearchBar, links.ts)

- Build passing ✓

## Conventions
- Keep it **static**: do not add a backend.
- Prefer small, reviewable commits.
- No secrets/keys in repo.

## Next steps
- Phase 2: Overlay Consolidation + Accessibility
- Phase 3: Data Model Hardening + UX Features
- Phase 4: Visual Polish + Design Consistency
- Phase 5: Code Quality + Testing
