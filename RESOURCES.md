# RESOURCES.md — Research Workflow

## Philosophy

Keep research **cheap and fast** by default. Only escalate to expensive tools when the task genuinely requires deep analysis.

## Two-Tier Workflow

### Tier 1: Quick Search (default)

**Tool:** Brave `web_search` via CLI / agent tool calls
**Cost:** Free (within API limits)
**Use for:**
- CSS tricks (e.g., "scroll-snap-type examples")
- API references (e.g., "PointerEvent properties MDN")
- Quick pattern checks (e.g., "Trello card CSS design")
- Library comparisons (e.g., "dnd-kit vs pointer events bundle size")
- Bug fixes (e.g., "iOS Safari touch-action none not working")

**How:**
```
web_search("scroll-snap-type x mandatory mobile example")
```

One or two searches usually give enough context. Read the top 2-3 results, extract what's needed, move on.

### Tier 2: Deep Research (flagged only)

**Tool:** Paid deep research (e.g., Perplexity Pro, Claude with extended thinking)
**Cost:** Credits / tokens
**Use ONLY when:**
- The task is flagged with `[deep]` in the ticket or conversation.
- Quick search returned conflicting or insufficient answers.
- The topic requires synthesizing 5+ sources (e.g., "best practices for accessible drag-and-drop on mobile 2024").
- Architecture decisions with long-term consequences.

**How to flag:**
Add `[deep]` to your task description or ask the agent:
> "This needs deep research — compare pointer events vs. HTML5 DnD vs. dnd-kit for mobile-first kanban."

## Decision Log

Track research decisions in PRD or inline code comments so future agents don't re-derive them.

| Decision | Research tier | Outcome |
|----------|--------------|---------|
| Drag implementation | Tier 1 | Pointer events — zero deps, works on touch + mouse. |
| Column scroll | Tier 1 | CSS scroll-snap — native, no JS needed. |
| Card ghost rendering | Tier 1 | Absolute-positioned clone — simpler than portal. |

## Guidelines

1. **Start with Tier 1.** If the answer is clear in < 2 searches, stop.
2. **Don't pre-research.** Research on demand, when you hit a specific question.
3. **Cache decisions.** Once decided, write it down. Don't re-research the same thing.
4. **Flag uncertainty.** If Tier 1 gives conflicting info, escalate to Tier 2 explicitly.
