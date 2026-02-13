import type { AppData, AgentTask, TaskStatus } from '../lib/appData';
import { Segmented } from '../components/ui/Segmented';
import { AGENTS, type AgentId } from '../lib/agents';
import { useCallback, useMemo, useRef, useState } from 'react';
import { KanbanColumn } from '../components/team/KanbanColumn';
import { TaskCard } from '../components/team/TaskCard';
import { TaskEditorSheet } from '../components/team/TaskEditorSheet';
import { InlineAddCard } from '../components/team/InlineAddCard';
import { useDragAndDrop } from '../hooks/useDragAndDrop';
import { uid } from '../lib/uid';

function getTasks(data: AppData): AgentTask[] {
  return data.agentTasks ?? [];
}

function setTasks(data: AppData, tasks: AgentTask[]): AppData {
  const next = structuredClone(data);
  next.agentTasks = tasks;
  return next;
}

function colTitle(s: TaskStatus) {
  if (s === 'todo') return 'To-do';
  if (s === 'doing') return 'In Progress';
  return 'Done';
}

const COLS: { status: TaskStatus; accent: 'neutral' | 'amber' | 'green' }[] = [
  { status: 'todo', accent: 'neutral' },
  { status: 'doing', accent: 'amber' },
  { status: 'done', accent: 'green' },
];

export function TeamPage({ data, onChange }: { data: AppData; onChange: (d: AppData) => void }) {
  const [agentFilter, setAgentFilter] = useState<AgentId | 'all'>('all');
  const [editorId, setEditorId] = useState<string | null>(null);
  const [dragActiveId, setDragActiveId] = useState<string | null>(null);
  const [activeCol, setActiveCol] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const tasks = getTasks(data);
  const editorTask = useMemo(() => tasks.find((t) => t.id === editorId) ?? null, [tasks, editorId]);

  const filtered = useMemo(() => {
    return tasks
      .filter((t) => (agentFilter === 'all' ? true : t.assignedTo === agentFilter))
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }, [tasks, agentFilter]);

  const byStatus = useMemo(() => {
    const map: Record<TaskStatus, AgentTask[]> = { todo: [], doing: [], done: [] };
    for (const t of filtered) map[t.status].push(t);
    return map;
  }, [filtered]);

  const updateTask = useCallback(
    (id: string, patch: Partial<AgentTask>) => {
      const next = tasks.map((t) => (t.id === id ? { ...t, ...patch } : t));
      onChange(setTasks(data, next));
    },
    [data, onChange, tasks],
  );

  const deleteTask = useCallback(
    (id: string) => {
      const next = tasks.filter((t) => t.id !== id);
      onChange(setTasks(data, next));
    },
    [data, onChange, tasks],
  );

  const addTask = useCallback(
    (title: string, assignedTo: AgentId, status: TaskStatus) => {
      const next: AgentTask[] = [
        { id: uid(), title, assignedTo, status, createdAt: new Date().toISOString() },
        ...tasks,
      ];
      onChange(setTasks(data, next));
    },
    [data, onChange, tasks],
  );

  // Drag & drop
  const { cardProps, isDragging } = useDragAndDrop({
    onDragStart: (id) => setDragActiveId(id),
    onDragEnd: (id, dropTarget) => {
      if (dropTarget && (dropTarget === 'todo' || dropTarget === 'doing' || dropTarget === 'done')) {
        updateTask(id, { status: dropTarget as TaskStatus });
      }
      setDragActiveId(null);
    },
  });

  // Track active column for dots indicator
  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollLeft = el.scrollLeft;
    const colWidth = el.scrollWidth / 3;
    const idx = Math.round(scrollLeft / colWidth);
    setActiveCol(Math.min(2, Math.max(0, idx)));
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 pt-4 pb-safe-nav">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-color-text-primary">
            Board
          </h1>
          <p className="text-xs text-color-text-tertiary mt-0.5">
            {filtered.length} task{filtered.length !== 1 ? 's' : ''} &middot; {byStatus.doing.length} in progress
          </p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="mb-4">
        <Segmented
          value={agentFilter}
          onChange={(v) => setAgentFilter(v as any)}
          options={[
            { value: 'all', label: 'All' },
            { value: 'coordinator', label: 'Coord' },
            { value: 'researcher', label: 'Research' },
            { value: 'software-dev', label: 'Dev' },
          ]}
        />
      </div>

      {/* Board: mobile snap-scroll, desktop 3-column grid */}
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className={
          '-mx-4 px-4 overflow-x-auto md:overflow-visible ' +
          'scrollbar-none'
        }
      >
        <div className="grid grid-flow-col auto-cols-[85%] sm:auto-cols-[75%] md:auto-cols-auto md:grid-flow-row md:grid-cols-3 gap-3 snap-x snap-mandatory md:snap-none pb-2">
          {COLS.map(({ status, accent }) => (
            <div key={status} className="snap-start">
              <KanbanColumn
                title={colTitle(status)}
                count={byStatus[status].length}
                status={status}
                accent={accent}
                addCard={
                  <InlineAddCard
                    onAdd={(title, assignedTo) => addTask(title, assignedTo, status)}
                  />
                }
              >
                {byStatus[status].map((t) => {
                  const agent = AGENTS.find((a) => a.id === t.assignedTo);
                  const agentLabel = agent ? `${agent.emoji} ${agent.name}` : String(t.assignedTo);
                  const active = isDragging(t.id);
                  return (
                    <TaskCard
                      key={t.id}
                      task={t}
                      agentLabel={agentLabel}
                      dragging={active || dragActiveId === t.id}
                      onOpen={() => setEditorId(t.id)}
                      dragProps={cardProps(t.id)}
                    />
                  );
                })}
              </KanbanColumn>
            </div>
          ))}
        </div>
      </div>

      {/* Column indicator dots (mobile only) */}
      <div className="flex justify-center gap-1.5 mt-3 md:hidden">
        {COLS.map(({ status }, i) => (
          <div
            key={status}
            className={
              'h-1.5 rounded-full transition-all duration-200 ' +
              (i === activeCol
                ? 'w-4 bg-gray-800 dark:bg-gray-200'
                : 'w-1.5 bg-gray-300 dark:bg-gray-600')
            }
          />
        ))}
      </div>

      {/* Task editor bottom sheet */}
      <TaskEditorSheet
        open={!!editorId}
        task={editorTask}
        onClose={() => setEditorId(null)}
        onChange={(patch) => {
          if (!editorTask) return;
          updateTask(editorTask.id, patch);
        }}
        onDelete={() => {
          if (!editorTask) return;
          deleteTask(editorTask.id);
          setEditorId(null);
        }}
      />
    </div>
  );
}
