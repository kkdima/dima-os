# Dima OS — UI Redesign Plan (Home / Habits / Stats)

**Goal:** Bring Home, Habits, and Stats tabs up to the same “premium”, mobile‑first feel as the new **Team Board** (snap scroll, tight typography, clean surfaces, clear hierarchy), while keeping the app **static**, **Tailwind**, **localStorage**, and **fast**.

**Constraints**
- No backend, no auth.
- Data remains in `localStorage` (export/import stays).
- Reuse existing primitives (`Card`, `Segmented`, bottom sheets) rather than introducing heavy UI libs.

---

## 0) Current state (quick audit)

Reference premium patterns (already shipped)
- **Team Board** (`src/pages/TeamPage.tsx`) uses:
  - clear header + sublabel
  - segmented filter bar
  - mobile **snap horizontal scroll** with hidden scrollbar (`scrollbar-none`)
  - bottom sheet editor (`TaskEditorSheet` → `BottomSheet`)

Other tabs (today)
- **Home** (`src/pages/HomePage.tsx`)
  - good cards + sparkline, but feels “dashboardy” and not as polished as Board
  - still has placeholders (Calories/Training/Trading Discipline)
  - upcoming bills is a single large card (OK) but could be more scannable
- **Habits** (`src/pages/HabitsPage.tsx`)
  - functional, but list is visually uniform; needs stronger hierarchy, better “done” affordance
  - heatmap looks OK but could be more premium (spacing, contrast, labeling)
- **Stats** (`src/pages/StatsPage.tsx`)
  - charts are solid; input section is plain
  - BillsEditor lives here and dominates; should feel like a “module” not a random block

---

## 1) Style system (match Team Board)

### 1.1 Layout + spacing
- Adopt consistent screen wrapper across tabs:
  - **Mobile:** `px-4 pt-4 pb-28 max-w-xl mx-auto`
  - **Desktop:** keep max widths but allow Stats charts to breathe (optional `max-w-5xl` where appropriate)
- Standard vertical rhythm:
  - section spacing: `mt-3` for small gaps, `mt-4` for section starts
  - card padding: `p-4` baseline, `p-5` for hero/primary cards

### 1.2 Typography
- Use a consistent header pattern (like Team):
  - Tab title: `text-xl font-bold tracking-tight` (or `text-2xl` if you want louder)
  - Subtitle/hint: `text-xs text-gray-500 dark:text-gray-400`
- Numeric emphasis:
  - hero numbers: `text-3xl font-semibold tracking-tight`
  - supporting units: `text-base font-semibold text-gray-500 dark:text-gray-400`

### 1.3 Surface + borders + shadows
- Keep using `Card` as the surface primitive.
- Add a **premium** Card variant API (optional) so we can unify “interactive” and “hero” behavior:
  - `Card` props: `variant?: 'default' | 'interactive' | 'hero'`
  - `interactive`: subtle hover/press + cursor + focus ring
  - `hero`: slightly stronger border/shadow (still subtle)

**Files**
- `src/components/ui/Card.tsx` (extend)

### 1.4 Accent and semantic colors
Already defined in `src/index.css`:
- accent: `--color-accent` + coral utilities

Add light semantic accents used in Board columns to other tabs (optional):
- Neutral / Amber / Green chips & rings

**Files**
- `src/index.css` (`@layer utilities`) — add a couple of semantic helpers if needed.

---

## 2) Home tab redesign (src/pages/HomePage.tsx)

### 2.1 New structure (recommended)
**Top header**
- Left: “Today” (or “Dashboard”)
- Right: primary CTA `Check‑in` (already there) styled like Board actions
- Subtitle line under title (small): last check‑in date, or “3 metrics missing today”

**Section A — Hero “Daily score” (new)**
- A single hero card at top summarizing:
  - Sleep (value + trend)
  - Habits done today
  - Trading discipline status
- This reduces the “card spam” feel.

**Section B — Snap carousel (premium mobile)**
- Convert the 2‑column mini‑cards (Calories/Training) into a horizontal snap row on mobile:
  - sleep, calories, training, trading discipline → all as small “metric tiles”
- Desktop keeps grid.

**Section C — Bills module**
- Keep “Upcoming bills” but improve scannability:
  - show “Due today / tomorrow / next 7 days” buckets
  - show 1–3 next bills with clearer date emphasis

### 2.2 Component refactors
Introduce a reusable metric tile component so Home + Stats can share.
- `src/components/dashboard/MetricTile.tsx`
  - props: `title`, `value`, `unit`, `hint`, `rightSlot` (sparkline or icon), `accent?: 'coral' | 'neutral' | ...`.

Optional: Extract sparkline into `src/components/charts/Sparkline.tsx`

### 2.3 Interaction polish
- Make primary cards tappable with `Card variant="interactive"`.
- Ensure touch targets ≥44px.

---

## 3) Habits tab redesign (src/pages/HabitsPage.tsx)

### 3.1 New structure
**Header**
- Title + subtitle (“Tap to toggle today”) stays.
- Add small segmented filter (optional): `All / Today / Missed` (pure client filter).

**Habit row redesign**
Current: uniform card with heatmap.
Target:
- Top line: emoji + title
- Right: status pill `Done` / `Not yet` (chip)
- Second line: streak + 7d/30d with better visual separation
- Heatmap:
  - slightly larger cells on mobile (`h-3.5`), softer border radius, consistent gap
  - optionally label weeks markers every 7 days (tiny ticks)

### 3.2 Component extraction
- `src/components/habits/HabitCard.tsx`
- `src/components/habits/HabitHeatRow.tsx` (extracted from `HeatRow`)
- `src/components/ui/Chip.tsx` (if we want chips across app)

### 3.3 Add “Add habit” (optional phase 2)
- Inline add at top (like `InlineAddCard`): title + emoji picker (simple text input for emoji).
- Stored in `data.habits` (already supports emoji).

---

## 4) Stats tab redesign (src/pages/StatsPage.tsx)

### 4.1 New structure
**Header**
- Title “Stats” (shorter) + range segmented.

**Section A — Summary tiles**
- Weight / Sleep as metric tiles (same as Home) with better hierarchy.

**Section B — Charts as a swipeable deck (mobile)**
- On mobile: convert the two chart cards into a snap row:
  - Weight trend card
  - Sleep trend card
- On desktop: keep stacked or side‑by‑side (`md:grid md:grid-cols-2`).

**Section C — Quick add as bottom sheet (premium)**
Current: inline inputs.
Target:
- Replace with a single “Quick add” button opening a BottomSheet (reuse `BottomSheet`).
- Inside: two inputs + Save.

**Section D — Bills as a dedicated module**
BillsEditor is large; make it feel intentional:
- Add section header “Bills” + short subtitle
- Optionally collapse/expand BillsEditor (accordion) on mobile.

**Section E — Backup**
- Keep export/import but make it a dedicated module card with clearer copy.

### 4.2 Component refactors
- `src/components/stats/QuickAddSheet.tsx` (BottomSheet wrapper)
- Optional `src/components/ui/SectionHeader.tsx` for consistent section headings.

---

## 5) Cross-cutting improvements

### 5.1 Navigation + page headers consistency
- Ensure every tab uses the same header hierarchy:
  - `h1/h2` size, subtitle line, right‑side action area

### 5.2 Press states + accessibility
- For tappable cards/buttons: add `active:scale-[0.99]` or subtle background change.
- Add focus styles for keyboard users (low priority, but cheap).

### 5.3 “Premium scroll” pattern
- Reuse the Board pattern:
  - `overflow-x-auto scrollbar-none snap-x snap-mandatory`
  - tile width: `auto-cols-[85%] sm:auto-cols-[75%]`

---

## 6) Phased implementation plan (Plan-first)

### Phase 1 — Visual parity (1–2 hours)
**Objective:** Make it look cohesive fast.
- Extend `Card` variants (`src/components/ui/Card.tsx`).
- Create `MetricTile` component.
- Refactor Home summary tiles to use MetricTile.
- Adjust headers (Home/Habits/Stats) to match Team style.

Deliverable: screens feel “same product”.

### Phase 2 — Premium interactions (2–4 hours)
**Objective:** Add the board-like mobile polish.
- Add snap carousel to Home metric tiles.
- Add snap deck or 2‑col grid adaptive layout to Stats charts.
- Convert Stats Quick Add into a BottomSheet (`QuickAddSheet`).

Deliverable: mobile feels like a premium app, not a web page.

### Phase 3 — Information architecture (3–6 hours)
**Objective:** Reduce clutter, improve scan.
- Home: restructure into Hero daily score + modules.
- Habits: filters, chip status, optional add habit.
- Stats: Bills accordion/collapsible, better section headers.

Deliverable: fastest day-to-day flow.

---

## 7) Exact files likely to change (implementation later)

New files (proposed)
- `src/components/dashboard/MetricTile.tsx`
- `src/components/charts/Sparkline.tsx` (optional)
- `src/components/habits/HabitCard.tsx`
- `src/components/habits/HabitHeatRow.tsx`
- `src/components/stats/QuickAddSheet.tsx`
- `src/components/ui/Chip.tsx` (optional)
- `src/components/ui/SectionHeader.tsx` (optional)

Modified files
- `src/components/ui/Card.tsx`
- `src/pages/HomePage.tsx`
- `src/pages/HabitsPage.tsx`
- `src/pages/StatsPage.tsx`
- `src/index.css` (only if we add small utility helpers)

---

## 8) Approval questions for Dima (pick fast)

1) Titles language: keep English (“Home/Habits/Stats”) or switch UI to Russian?
2) Home top card: do we want a **single hero “Daily score”** or keep multiple cards?
3) Stats Quick Add: confirm moving it into a **bottom sheet** (recommended).
4) Bills: keep inside Stats, or split into its own tab later?

(Stop here — waiting for approval before any code changes.)
