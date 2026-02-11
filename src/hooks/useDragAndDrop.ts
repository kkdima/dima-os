import { useCallback, useRef } from 'react';

export interface DragCallbacks {
  onDragStart?: (id: string) => void;
  onDragEnd?: (id: string, dropTarget: string | null) => void;
}

interface DragState {
  id: string;
  startX: number;
  startY: number;
  ghost: HTMLElement | null;
  active: boolean;
  timer: ReturnType<typeof setTimeout> | null;
  origRect: DOMRect | null;
}

const LONG_PRESS_MS = 250;
const MOVE_THRESHOLD = 5;

/**
 * Pointer-events-based drag & drop that works on both touch and mouse.
 *
 * Usage:
 *   const { cardProps } = useDragAndDrop({ onDragStart, onDragMove, onDragEnd });
 *   <div {...cardProps(cardId)}>...</div>
 *
 * Drop targets must have `data-drop-status="todo|doing|done"` attribute.
 */
export function useDragAndDrop(callbacks: DragCallbacks) {
  const stateRef = useRef<DragState | null>(null);

  const hitTestDropTarget = useCallback((x: number, y: number): string | null => {
    const els = document.querySelectorAll<HTMLElement>('[data-drop-status]');
    for (const el of els) {
      const rect = el.getBoundingClientRect();
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        return el.dataset.dropStatus ?? null;
      }
    }
    return null;
  }, []);

  const clearHighlights = useCallback(() => {
    document.querySelectorAll<HTMLElement>('[data-drop-status]').forEach((el) => {
      el.classList.remove('drop-highlight');
    });
  }, []);

  const highlightTarget = useCallback((status: string | null) => {
    clearHighlights();
    if (!status) return;
    document.querySelectorAll<HTMLElement>(`[data-drop-status="${status}"]`).forEach((el) => {
      el.classList.add('drop-highlight');
    });
  }, [clearHighlights]);

  const cleanup = useCallback(() => {
    const s = stateRef.current;
    if (!s) return;
    if (s.timer) clearTimeout(s.timer);
    if (s.ghost) {
      s.ghost.remove();
    }
    clearHighlights();
    document.body.style.userSelect = '';
    stateRef.current = null;
  }, [clearHighlights]);

  const onPointerDown = useCallback(
    (id: string, e: React.PointerEvent) => {
      // Only primary button / single touch
      if (e.button !== 0) return;
      // Don't interfere with inputs
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'BUTTON') return;

      const el = e.currentTarget as HTMLElement;

      stateRef.current = {
        id,
        startX: e.clientX,
        startY: e.clientY,
        ghost: null,
        active: false,
        timer: null,
        origRect: el.getBoundingClientRect(),
      };

      // Long-press timer for mobile
      stateRef.current.timer = setTimeout(() => {
        const s = stateRef.current;
        if (!s || s.active) return;
        activateDrag(s, el);
      }, LONG_PRESS_MS);

      // Capture pointer
      el.setPointerCapture(e.pointerId);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const activateDrag = useCallback(
    (s: DragState, sourceEl: HTMLElement) => {
      s.active = true;
      if (s.timer) {
        clearTimeout(s.timer);
        s.timer = null;
      }

      // Haptic
      if (navigator.vibrate) {
        try { navigator.vibrate(25); } catch { /* ignore */ }
      }

      // Create ghost
      const ghost = sourceEl.cloneNode(true) as HTMLElement;
      const rect = s.origRect!;
      ghost.style.position = 'fixed';
      ghost.style.left = `${rect.left}px`;
      ghost.style.top = `${rect.top}px`;
      ghost.style.width = `${rect.width}px`;
      ghost.style.zIndex = '9999';
      ghost.style.pointerEvents = 'none';
      ghost.style.opacity = '0.92';
      ghost.style.transform = 'scale(1.04) rotate(1.5deg)';
      ghost.style.transition = 'transform 150ms ease, box-shadow 150ms ease';
      ghost.style.boxShadow = '0 12px 40px rgba(0,0,0,0.18)';
      ghost.style.borderRadius = '16px';
      ghost.classList.add('drag-ghost');
      document.body.appendChild(ghost);
      s.ghost = ghost;

      // Prevent text selection & scrolling
      document.body.style.userSelect = 'none';

      callbacks.onDragStart?.(s.id);
    },
    [callbacks],
  );

  const onPointerMove = useCallback(
    (id: string, e: React.PointerEvent) => {
      const s = stateRef.current;
      if (!s || s.id !== id) return;

      const dx = e.clientX - s.startX;
      const dy = e.clientY - s.startY;

      if (!s.active) {
        // If moved too much before long-press, cancel (user is scrolling)
        if (Math.abs(dx) > MOVE_THRESHOLD || Math.abs(dy) > MOVE_THRESHOLD) {
          // On desktop (mouse), start drag immediately on move
          if (e.pointerType === 'mouse') {
            const el = e.currentTarget as HTMLElement;
            activateDrag(s, el);
          } else {
            // Touch — cancel, user is scrolling
            cleanup();
            return;
          }
        }
        return;
      }

      // Move ghost
      if (s.ghost && s.origRect) {
        s.ghost.style.left = `${s.origRect.left + dx}px`;
        s.ghost.style.top = `${s.origRect.top + dy}px`;
      }

      // Hit test
      const target = hitTestDropTarget(e.clientX, e.clientY);
      highlightTarget(target);
    },
    [activateDrag, cleanup, hitTestDropTarget, highlightTarget],
  );

  const onPointerUp = useCallback(
    (id: string, e: React.PointerEvent) => {
      const s = stateRef.current;
      if (!s || s.id !== id) return;

      if (s.active) {
        const target = hitTestDropTarget(e.clientX, e.clientY);
        callbacks.onDragEnd?.(id, target);
      }

      cleanup();
    },
    [callbacks, cleanup, hitTestDropTarget],
  );

  const onPointerCancel = useCallback(
    (_id: string) => {
      const s = stateRef.current;
      if (s?.active) {
        callbacks.onDragEnd?.(s.id, null);
      }
      cleanup();
    },
    [callbacks, cleanup],
  );

  /** Returns props to spread on a draggable card element */
  const cardProps = useCallback(
    (id: string) => ({
      onPointerDown: (e: React.PointerEvent) => onPointerDown(id, e),
      onPointerMove: (e: React.PointerEvent) => onPointerMove(id, e),
      onPointerUp: (e: React.PointerEvent) => onPointerUp(id, e),
      onPointerCancel: () => onPointerCancel(id),
      style: { touchAction: 'pan-y' as const },
      'data-drag-id': id,
    }),
    [onPointerDown, onPointerMove, onPointerUp, onPointerCancel],
  );

  const isDragging = useCallback(
    (id: string) => stateRef.current?.id === id && stateRef.current.active,
    [],
  );

  return { cardProps, isDragging };
}
