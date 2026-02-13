import type { AgentTask, TaskStatus } from '../../lib/appData';

const statusStyles: Record<TaskStatus, { bg: string; text: string; label: string }> = {
  todo: {
    bg: 'bg-gray-100 bg-color-bg-secondary',
    text: 'text-color-text-secondary dark:text-color-text-tertiary',
    label: 'To-do',
  },
  doing: {
    bg: 'bg-amber-100/80 dark:bg-amber-500/15',
    text: 'text-amber-700 dark:text-amber-300',
    label: 'Doing',
  },
  done: {
    bg: 'bg-emerald-100/80 dark:bg-emerald-500/15',
    text: 'text-emerald-700 dark:text-emerald-300',
    label: 'Done',
  },
};

export function TaskCard({
  task,
  agentLabel,
  dragging,
  onOpen,
  dragProps,
}: {
  task: AgentTask;
  agentLabel: string;
  dragging: boolean;
  onOpen: () => void;
  dragProps?: Record<string, unknown>;
}) {
  const s = statusStyles[task.status];

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={(e) => {
        // Don't open if we were dragging
        if (dragging) {
          e.preventDefault();
          return;
        }
        onOpen();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onOpen();
      }}
      {...dragProps}
      className={
        'group rounded-xl border border-black/5 dark:border-white/8 ' +
        'bg-white dark:bg-[#1c1c1e] ' +
        'px-3 py-3 cursor-grab select-none ' +
        'shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.04)] ' +
        'dark:shadow-[0_1px_3px_rgba(0,0,0,0.2),0_4px_12px_rgba(0,0,0,0.15)] ' +
        'active:cursor-grabbing transition-all duration-150 ' +
        (dragging
          ? 'opacity-40 scale-[0.97]'
          : 'hover:shadow-[0_2px_8px_rgba(0,0,0,0.08),0_8px_24px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_2px_8px_rgba(0,0,0,0.3)] hover:border-black/10 dark:hover:border-white/12')
      }
    >
      <div className="text-[15px] font-semibold leading-snug tracking-tight text-gray-900 dark:text-gray-50">
        {task.title}
      </div>

      <div className="mt-2 flex items-center gap-1.5">
        <span className="inline-flex items-center rounded-md bg-black/[0.04] dark:bg-white/8 px-1.5 py-0.5 text-xs font-medium text-color-text-secondary dark:text-color-text-tertiary">
          {agentLabel}
        </span>
        <span className={'inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium ' + s.bg + ' ' + s.text}>
          {s.label}
        </span>
      </div>
    </div>
  );
}
