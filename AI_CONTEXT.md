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

## Current status (Feb 13, 2026)
- **Phase 1: Critical Bug Fixes — COMPLETED**
  - Fixed timezone bugs, added AgentTask types, fixed double-save, month overflow, habit autofill, removed metric protection, extracted uid(), fixed demo bills, deleted 6 orphaned files

- **Phase 2: UI/UX Improvements — COMPLETED**
  - Fixed InlineAddCard accent color (blue → coral)
  - Removed misleading backup card from HabitsPage
  - Fixed Stats Day view to show last 2 data points
  - Added current date to Header
  - Consolidated coral theme tokens in @theme block
  - Replaced emoji nav icons with SVG icons (Home, CheckCircle, BarChart, Grid)
  - Use real checkin data for sparklines (calories, training)
  - Added habit CRUD (create/delete with emoji support)
  - Added bill editing via BottomSheet

- **Phase 3: Advanced Features + Testing — COMPLETED**
  - Migrated DailyCheckinModal to BottomSheet component
  - Debounced localStorage writes (300ms delay)
  - Set up Vitest testing framework with 38 unit tests
  - Tests cover: bills (10 tests), appData (16 tests), rules (12 tests)

- **Phase 4: Home Today-First Polish — COMPLETED**
  - Rebuilt Home layout for command-first execution (Command Center + focus checks)
  - Added Quick capture sheet with Telegram commands + Cmd/Ctrl+K shortcut
  - Improved today metric accuracy (match metrics by date)
  - Streamlined hierarchy (single daily score + progress bar, grouped metrics)

- **Build: ✅ Passing (Feb 13, 2026)**
- **Tests: ✅ 41/41 Passing (Feb 13, 2026)**

## Next steps (Feb 13, 2026)
- Review Home on mobile + desktop for layout balance

## Conventions
- Keep it **static**: do not add a backend.
- Prefer small, reviewable commits.
- No secrets/keys in repo.
- Run `npm test` before committing.
