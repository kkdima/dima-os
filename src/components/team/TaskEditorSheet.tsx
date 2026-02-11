import type { AgentId } from '../../lib/agents';
import type { AgentTask, TaskStatus } from '../../pages/TeamPage';
import { AGENTS } from '../../lib/agents';
import { BottomSheet } from '../ui/BottomSheet';

function statusLabel(s: TaskStatus) {
  if (s === 'todo') return 'To-do';
  if (s === 'doing') return 'Doing';
  return 'Done';
}

export function TaskEditorSheet({
  open,
  task,
  onClose,
  onChange,
  onDelete,
}: {
  open: boolean;
  task: AgentTask | null;
  onClose: () => void;
  onChange: (patch: Partial<AgentTask>) => void;
  onDelete: () => void;
}) {
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Task"
      description={task ? statusLabel(task.status) : undefined}
      footer={
        <div className="pt-4 flex items-center justify-between">
          <button
            onClick={onDelete}
            className="rounded-2xl px-3 py-2 text-sm font-semibold text-red-700 dark:text-red-300 bg-red-500/10 hover:bg-red-500/15"
          >
            Delete
          </button>
          <button
            onClick={onClose}
            className="rounded-2xl px-4 py-2 text-sm font-semibold bg-black/5 dark:bg-white/10 text-gray-900 dark:text-gray-100 hover:bg-black/8"
          >
            Done
          </button>
        </div>
      }
    >
      {!task ? null : (
        <div className="grid gap-3">
          <label className="grid gap-1">
            <div className="text-xs font-semibold text-gray-600 dark:text-gray-300">Title</div>
            <textarea
              value={task.title}
              onChange={(e) => onChange({ title: e.target.value })}
              rows={3}
              className="w-full resize-none rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-[#1c1c1e]/50 px-3 py-2 outline-none"
            />
          </label>

          <label className="grid gap-1">
            <div className="text-xs font-semibold text-gray-600 dark:text-gray-300">Assigned</div>
            <select
              value={task.assignedTo}
              onChange={(e) => onChange({ assignedTo: e.target.value as AgentId })}
              className="w-full rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-[#1c1c1e]/50 px-3 py-2 outline-none"
            >
              {AGENTS.filter((a) => a.id !== 'main').map((a) => (
                <option key={a.id} value={a.id}>
                  {a.emoji} {a.name}
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-1">
            <div className="text-xs font-semibold text-gray-600 dark:text-gray-300">Status</div>
            <div className="grid grid-cols-3 gap-2">
              {(['todo', 'doing', 'done'] as TaskStatus[]).map((s) => {
                const active = task.status === s;
                const activeCls =
                  s === 'doing'
                    ? 'bg-amber-500/15 text-amber-800 dark:text-amber-200'
                    : s === 'done'
                      ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-200'
                      : 'bg-coral-500/15 text-coral-800 dark:text-coral-200';
                return (
                  <button
                    key={s}
                    onClick={() => onChange({ status: s })}
                    className={
                      'rounded-2xl px-3 py-2 text-sm font-semibold transition ' +
                      (active ? activeCls : 'bg-black/5 dark:bg-white/10 text-gray-800 dark:text-gray-100')
                    }
                  >
                    {statusLabel(s)}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </BottomSheet>
  );
}
