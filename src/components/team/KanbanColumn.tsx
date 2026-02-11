import type { ReactNode } from 'react';
import type { TaskStatus } from '../../pages/TeamPage';

const accents: Record<string, { dot: string; ring: string; headerBg: string }> = {
  neutral: {
    dot: 'bg-gray-400 dark:bg-gray-500',
    ring: 'ring-gray-400/40',
    headerBg: 'bg-gray-100/80 dark:bg-white/5',
  },
  amber: {
    dot: 'bg-amber-500',
    ring: 'ring-amber-500/40',
    headerBg: 'bg-amber-50/80 dark:bg-amber-500/5',
  },
  green: {
    dot: 'bg-emerald-500',
    ring: 'ring-emerald-500/40',
    headerBg: 'bg-emerald-50/80 dark:bg-emerald-500/5',
  },
};

export function KanbanColumn({
  title,
  count,
  status,
  accent = 'neutral',
  children,
  empty,
  addCard,
}: {
  title: string;
  count: number;
  status: TaskStatus;
  accent?: 'neutral' | 'amber' | 'green';
  children: ReactNode;
  empty?: ReactNode;
  addCard?: ReactNode;
}) {
  const a = accents[accent] ?? accents.neutral;

  return (
    <section
      data-drop-status={status}
      className={
        'flex flex-col rounded-2xl border border-black/5 dark:border-white/8 ' +
        'bg-gray-50/70 dark:bg-white/[0.02] backdrop-blur-sm ' +
        'min-h-[200px] transition-shadow duration-200 ' +
        // drop-highlight class is toggled by the drag hook via DOM
        '[&.drop-highlight]:ring-2 ' + a.ring
      }
    >
      {/* Sticky header */}
      <div
        className={
          'sticky top-0 z-10 flex items-center justify-between px-4 py-3 ' +
          'rounded-t-2xl border-b border-black/5 dark:border-white/5 ' +
          a.headerBg + ' backdrop-blur-sm'
        }
      >
        <div className="flex items-center gap-2">
          <div className={'h-2.5 w-2.5 rounded-full ' + a.dot} />
          <h3 className="text-sm font-bold tracking-tight text-gray-900 dark:text-gray-100 uppercase">
            {title}
          </h3>
        </div>
        <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] rounded-full bg-black/5 dark:bg-white/10 px-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300">
          {count}
        </span>
      </div>

      {/* Cards area */}
      <div className="flex-1 px-2.5 py-2.5 space-y-2">
        {children}
        {count === 0 && (
          <div className="rounded-xl border border-dashed border-black/8 dark:border-white/8 bg-black/[0.02] dark:bg-white/[0.02] px-3 py-4 text-center text-sm text-gray-400 dark:text-gray-500">
            {empty ?? 'No tasks yet'}
          </div>
        )}
      </div>

      {/* Inline add card */}
      {addCard && (
        <div className="px-2.5 pb-2.5">
          {addCard}
        </div>
      )}
    </section>
  );
}
