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

## Current status (last known)
- Project scaffold + components exist in `src/components/*` and `src/App.tsx`.
- GitHub Pages workflow exists.
- **Sprint completed (Feb 10, 2026):**
  1. ✅ Trading discipline uses real data from Daily Check-in (trades count + log status)
  2. ✅ Bills urgency flow with buckets: Due Today (red), Due Tomorrow (orange), Due This Week (yellow)
  3. ✅ Daily Check-in autopopulates habits: calories ≥3100, training >0, no smoking, ≤2 trades, trade log done

## Conventions
- Keep it **static**: do not add a backend.
- Prefer small, reviewable commits.
- No secrets/keys in repo.

## Next steps (if needed)
- Ensure `vite.config.ts` has correct `base` for GitHub Pages.
- Verify `npm run build` and `npm run preview`.
- Push to GitHub and confirm Pages deploy.
