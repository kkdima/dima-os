import { useEffect, useRef, useState } from 'react';
import type { AgentId } from '../../lib/agents';
import { AGENTS } from '../../lib/agents';

export function InlineAddCard({
  onAdd,
}: {
  onAdd: (title: string, assignedTo: AgentId) => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [assignedTo, setAssignedTo] = useState<AgentId>('coordinator');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  function submit() {
    const trimmed = title.trim();
    if (!trimmed) return;
    onAdd(trimmed, assignedTo);
    setTitle('');
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className={
          'w-full rounded-xl border border-dashed border-black/8 dark:border-white/8 ' +
          'px-3 py-2 text-sm text-gray-400 dark:text-gray-500 ' +
          'hover:border-black/15 dark:hover:border-white/15 hover:text-gray-600 dark:hover:text-gray-300 ' +
          'transition-colors duration-150'
        }
      >
        + Add card
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-black/8 dark:border-white/10 bg-white dark:bg-[#1c1c1e] p-2.5 shadow-sm space-y-2">
      <input
        ref={inputRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit();
          if (e.key === 'Escape') { setOpen(false); setTitle(''); }
        }}
        placeholder="Task title..."
        className="w-full rounded-lg border border-black/8 dark:border-white/10 bg-gray-50/80 dark:bg-white/5 px-2.5 py-1.5 text-sm outline-none placeholder:text-gray-400"
      />
      <div className="flex items-center gap-2">
        <select
          value={assignedTo}
          onChange={(e) => setAssignedTo(e.target.value as AgentId)}
          className="flex-1 min-w-0 rounded-lg border border-black/8 dark:border-white/10 bg-gray-50/80 dark:bg-white/5 px-2 py-1 text-xs outline-none"
        >
          {AGENTS.filter((a) => a.id !== 'main').map((a) => (
            <option key={a.id} value={a.id}>
              {a.emoji} {a.name}
            </option>
          ))}
        </select>
        <button
          onClick={submit}
          className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 text-xs font-semibold transition-colors"
        >
          Add
        </button>
        <button
          onClick={() => { setOpen(false); setTitle(''); }}
          className="rounded-lg bg-black/5 dark:bg-white/10 px-2 py-1 text-xs text-gray-600 dark:text-gray-300 hover:bg-black/8 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
