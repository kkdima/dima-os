# PRD: Team Board Redesign (Trello-like)

**Status:** Draft v1
**Author:** Claude (AI agent)
**Date:** 2025-02-10
**Stakeholder:** Dima

---

## 1. Overview

Redesign the **Team (Board)** tab of Dima OS Dashboard to feel premium and polished — comparable to Trello — while remaining fully static (localStorage, no backend). The current implementation uses HTML5 drag/drop with 3 status columns but lacks touch support, visual polish, and a clear add-card flow.

## 2. Goals

| # | Goal | Metric |
|---|------|--------|
| G1 | **Touch-first drag & drop** — cards can be moved between columns on mobile via long-press + drag. | Works on iOS Safari & Chrome Android without jank. |
| G2 | **Horizontal-scroll columns with sticky headers** — columns scroll horizontally on mobile with snap points; headers stay visible while scrolling cards within a column. | Column headers stay fixed during vertical card scroll. |
| G3 | **Clear add-card flow** — inline "Add card" button at the bottom of each column (Trello-style), or a floating "+" that opens a focused input. | < 2 taps to start adding a card. |
| G4 | **Quick-edit assignee & status** — tap a card to open a bottom sheet with one-tap status change and assignee picker. | Status can be changed in 1 tap from the sheet. |
| G5 | **Premium dark mode** — consistent glassmorphism, subtle shadows, no broken contrast. | Passes WCAG AA on all text. |
| G6 | **Zero new dependencies** — keep the bundle small; use only CSS + pointer events. | No new npm packages added. |

## 3. Non-Goals

- **Real-time sync** — no WebSocket/server; localStorage only.
- **Card descriptions, comments, attachments** — out of scope for v1.
- **Multiple boards** — single board with 3 columns is sufficient.
- **Labels/tags system** — the agent assignee chip is the only card metadata for now.
- **Undo/redo** — not in scope.
- **Desktop drag feel** (e.g., react-beautiful-dnd) — we'll use pointer events, which is simpler and zero-dep.

## 4. User Stories

### US-1: Mobile user drags a card between columns
> As a mobile user, I want to long-press a card and drag it to another column so I can update its status without opening a sheet.

**Acceptance:** Long-press (300ms) lifts the card with a scale animation. Dragging over a column highlights it. Dropping updates the card's status. If dropped outside, the card snaps back.

### US-2: User adds a card inline
> As a user, I want to tap "+ Add card" at the bottom of a column so I can quickly create a task assigned to that column's status.

**Acceptance:** Tapping shows an inline text input + agent picker within the column. Pressing Enter or tapping "Add" creates the card. Pressing Escape or tapping away cancels.

### US-3: User quick-edits a card
> As a user, I want to tap a card to open a bottom sheet where I can change the title, assignee, and status with minimal effort.

**Acceptance:** Bottom sheet opens with: editable title (auto-focused textarea), tappable status pills (To-do / Doing / Done), agent picker dropdown, and a delete button. Changes save immediately (optimistic).

### US-4: User scrolls columns on mobile
> As a mobile user, I want to swipe left/right between columns like Trello so I can see one column at a time.

**Acceptance:** Columns snap horizontally. Active column indicator dots are visible. Vertical scroll within a column is independent of horizontal column swipe.

### US-5: User filters by agent
> As a user, I want to filter the board by agent so I can see only tasks assigned to a specific agent.

**Acceptance:** Segmented control at the top filters all columns. Filter state persists in component state (not URL).

## 5. UX Specification

### 5.1 Layout

```
┌──────────────────────────────────────┐
│  Board                    [+ New]    │
│  ───────────────────────────         │
│  [All] [Coord] [Research] [Dev]      │  ← segmented filter
├──────────────────────────────────────┤
│                                      │
│  ┌─────────┐ ┌─────────┐ ┌────────┐ │
│  │ TO-DO 3 │ │ DOING 1 │ │ DONE 5 │ │  ← sticky column headers
│  │─────────│ │─────────│ │────────│ │
│  │ Card    │ │ Card    │ │ Card   │ │
│  │ Card    │ │         │ │ Card   │ │
│  │ Card    │ │         │ │ Card   │ │
│  │         │ │         │ │ Card   │ │
│  │ [+Add]  │ │ [+Add]  │ │ Card   │ │
│  └─────────┘ └─────────┘ └────────┘ │
│  ● ○ ○                              │  ← column indicator (mobile)
└──────────────────────────────────────┘
```

**Mobile (< 768px):**
- Single-column view with horizontal snap scroll.
- Column takes ~88% viewport width.
- Column indicator dots below.
- Header card (filter + new button) is fixed above the scroll area.

**Desktop (≥ 768px):**
- 3-column grid, equal widths.
- All columns visible simultaneously.
- No snap scroll needed.

### 5.2 Card Design

```
┌──────────────────────────────────┐
│  Fix Perplexity relay            │  ← title, 15px semibold
│                                  │
│  🧭 Coordinator          To-do  │  ← agent chip + status badge
└──────────────────────────────────┘
```

- Rounded corners (16px / `rounded-2xl`).
- Subtle shadow (`shadow-sm`).
- Light mode: white bg, dark border `border-black/5`.
- Dark mode: `bg-white/5`, border `border-white/8`.
- Active/dragging state: slight scale-up (`scale-[1.03]`), stronger shadow, ring highlight.

### 5.3 Column Design

- Background: `bg-gray-50/80 dark:bg-white/3`.
- Rounded top corners for the header area.
- Header: status dot (colored) + title + count badge.
- Sticky header so it stays visible as cards scroll vertically (on desktop when column is tall).
- Drop target highlight: colored ring matching column accent.
- Empty state: dashed border card with "No tasks. Drag here or add one."

### 5.4 Add Card Inline

- "+" button at the bottom of each column.
- On click: expands into an inline form (input + agent select + submit button).
- Compact: single row on mobile.
- Auto-focuses the input.
- Enter submits, Escape cancels.

## 6. Interaction Specification

### 6.1 Touch Drag & Drop (Pointer Events)

HTML5 drag/drop doesn't work on mobile. We replace it with pointer events:

1. **pointerdown** on a card → start a 300ms timer (long-press detection).
2. If pointer moves > 5px before 300ms → cancel (it's a scroll gesture).
3. After 300ms → **drag mode**:
   - Clone the card as a "ghost" element positioned absolutely.
   - Apply `touch-action: none` to prevent scroll interference.
   - Haptic feedback (optional: `navigator.vibrate(30)` if available).
4. **pointermove** → move the ghost to follow the pointer.
   - Hit-test which column the pointer is over → highlight that column.
5. **pointerup** → drop the card:
   - If over a valid column → update card status.
   - Animate card into place (or snap back if invalid).
   - Remove ghost element.

**Desktop:** Also works via pointer events, but additionally keep standard click for tap-to-edit (since there's no long-press needed — can use regular click for edit, and drag starts on `pointermove` after small threshold).

**Implementation note:** We'll use a custom `useDragAndDrop` hook that handles all of this with pointer events. No library needed.

### 6.2 Click vs Drag Disambiguation

- **Mobile:** Long-press (300ms) starts drag. Tap opens editor sheet.
- **Desktop:** Click opens editor sheet. Mouse down + move > 5px starts drag (cancel the click).

### 6.3 Column Scroll

- Mobile: CSS `overflow-x: auto` + `scroll-snap-type: x mandatory` on the columns container.
- Each column: `scroll-snap-align: start`.
- Vertical scroll within columns: natural overflow.

## 7. Data Model

### Current Model (no changes needed)

```typescript
type TaskStatus = 'todo' | 'doing' | 'done';

interface AgentTask {
  id: string;
  title: string;
  assignedTo: AgentId;
  status: TaskStatus;
  createdAt: string; // ISO datetime
}
```

The current data model is sufficient for Phase 1. Tasks are stored as `agentTasks` array on the AppData object (via `any` cast), persisted to localStorage.

### Future Considerations (not in scope)

- `description: string` — card description/notes.
- `priority: 'low' | 'medium' | 'high'` — priority levels.
- `dueDate?: string` — due dates.
- `order: number` — explicit ordering within a column (currently sorted by `createdAt`).

## 8. Acceptance Criteria

| # | Criterion | How to verify |
|---|-----------|---------------|
| AC1 | Cards can be dragged between columns on iOS Safari. | Manual test on iPhone. |
| AC2 | Cards can be dragged between columns on Chrome Android. | Manual test on Android phone. |
| AC3 | Cards can be dragged between columns on desktop (mouse). | Manual test in Chrome desktop. |
| AC4 | Tapping a card opens the editor bottom sheet. | Tap any card → sheet opens. |
| AC5 | Inline "Add card" creates a task in the correct column. | Tap + in "Doing" → new card appears in "Doing". |
| AC6 | Agent filter works across all columns. | Select "Dev" → only dev-assigned cards show. |
| AC7 | Columns snap-scroll horizontally on mobile. | Swipe left/right on mobile viewport. |
| AC8 | Dark mode has no broken contrast or invisible text. | Toggle dark mode, inspect all elements. |
| AC9 | `npm run build` succeeds with zero errors. | CI build passes. |
| AC10 | No new npm dependencies added. | Check `package.json` diff. |

## 9. Rollout Plan

### Phase 1: Foundation (this PR)
- Refactored column layout with sticky headers.
- Improved card design (status badge, better spacing).
- Inline "Add card" button per column.
- Pointer-events-based drag & drop (replaces HTML5 drag/drop).
- Dark mode polish.
- Column indicator dots on mobile.

### Phase 2: Polish & Animations
- Smooth drag ghost with card snapshot.
- Drop animation (card slides into place).
- Haptic feedback on mobile drag.
- Column scroll position memory.
- Card count animations.

### Phase 3: Extended Features
- Card descriptions (markdown).
- Due dates + overdue indicators.
- Explicit card ordering (drag to reorder within a column).
- Search/filter within cards.
- Archive column (collapsed "Done" older than 7 days).

---

*This PRD is a living document. Update as implementation progresses.*
