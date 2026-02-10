import type { AppData } from '../lib/appData';
import { saveAppData } from '../lib/appData';
import { Card } from '../components/ui/Card';
import { Segmented } from '../components/ui/Segmented';
import { AGENTS, type AgentId } from '../lib/agents';
import { useMemo, useState } from 'react';

export type TaskStatus = 'todo' | 'doing' | 'done';

export interface AgentTask {
  id: string;
  title: string;
  assignedTo: AgentId;
  status: TaskStatus;
  createdAt: string; // iso
}

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function getTasks(data: AppData): AgentTask[] {
  const anyData = data as any;
  if (!Array.isArray(anyData.agentTasks)) return [];
  return anyData.agentTasks as AgentTask[];
}

function setTasks(data: AppData, tasks: AgentTask[]): AppData {
  const next: any = structuredClone(data);
  next.agentTasks = tasks;
  saveAppData(next);
  return next as AppData;
}

function colTitle(s: TaskStatus) {
  if (s === 'todo') return 'To-do';
  if (s === 'doing') return 'Doing';
  return 'Done';
}

function allowDrop(e: React.DragEvent) {
  e.preventDefault();
}

export function TeamPage({ data, onChange }: { data: AppData; onChange: (d: AppData) => void }) {
  const [agentFilter, setAgentFilter] = useState<AgentId | 'all'>('all');
  const [newTitle, setNewTitle] = useState('');
  const [newAssignedTo, setNewAssignedTo] = useState<AgentId>('coordinator');
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const tasks = getTasks(data);

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

  function addTask() {
    const title = newTitle.trim();
    if (!title) return;
    const next: AgentTask[] = [
      { id: uid(), title, assignedTo: newAssignedTo, status: 'todo', createdAt: new Date().toISOString() },
      ...tasks,
    ];
    onChange(setTasks(data, next));
    setNewTitle('');
  }

  function updateTask(id: string, patch: Partial<AgentTask>) {
    const next = tasks.map((t) => (t.id === id ? { ...t, ...patch } : t));
    onChange(setTasks(data, next));
  }

  function deleteTask(id: string) {
    const next = tasks.filter((t) => t.id !== id);
    onChange(setTasks(data, next));
  }

  function onDropStatus(status: TaskStatus, e: React.DragEvent) {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/taskId') || draggingId;
    if (!id) return;
    updateTask(id, { status });
    setDraggingId(null);
  }

  const cols: TaskStatus[] = ['todo', 'doing', 'done'];

  return (
    <div className="mx-auto max-w-xl px-4 pt-4 space-y-4">
      <Card>
        <div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Agents</div>
          <div className="text-xl font-bold">Board</div>
          <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">Trello-style kanban for your employee tasks.</div>

          <div className="mt-3 grid gap-2">
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="New task (e.g., 'Fix Perplexity relay')"
              className="w-full rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-[#1c1c1e]/50 px-3 py-2 outline-none"
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                value={newAssignedTo}
                onChange={(e) => setNewAssignedTo(e.target.value as AgentId)}
                className="w-full rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-[#1c1c1e]/50 px-3 py-2 outline-none"
              >
                {AGENTS.filter((a) => a.id !== 'main').map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.emoji} {a.name}
                  </option>
                ))}
              </select>
              <button onClick={addTask} className="rounded-2xl bg-coral-600 text-white py-2 font-semibold">
                Add
              </button>
            </div>

            <Segmented
              value={agentFilter}
              onChange={(v) => setAgentFilter(v as any)}
              options={[
                { value: 'all', label: 'All agents' },
                { value: 'coordinator', label: 'Coord' },
                { value: 'researcher', label: 'Research' },
                { value: 'software-dev', label: 'Dev' },
              ]}
            />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-3">
        {cols.map((s) => (
          <Card key={s}>
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">{colTitle(s)}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{byStatus[s].length}</div>
            </div>

            <div
              className="mt-3 space-y-2 min-h-[56px]"
              onDragOver={allowDrop}
              onDrop={(e) => onDropStatus(s, e)}
            >
              {byStatus[s].length === 0 && (
                <div className="text-sm text-gray-500 dark:text-gray-400">Drop tasks here.</div>
              )}

              {byStatus[s].map((t) => {
                const agent = AGENTS.find((a) => a.id === t.assignedTo);
                return (
                  <div
                    key={t.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/taskId', t.id);
                      setDraggingId(t.id);
                    }}
                    onDragEnd={() => setDraggingId(null)}
                    className={
                      'rounded-2xl border border-black/5 dark:border-white/10 p-3 bg-white/60 dark:bg-white/5 ' +
                      (draggingId === t.id ? 'opacity-70' : '')
                    }
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold">{t.title}</div>
                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {agent?.emoji} {agent?.name}
                        </div>
                      </div>
                      <button
                        onClick={() => deleteTask(t.id)}
                        className="text-xs text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
                      >
                        Delete
                      </button>
                    </div>

                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <select
                        value={t.assignedTo}
                        onChange={(e) => updateTask(t.id, { assignedTo: e.target.value as AgentId })}
                        className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-[#1c1c1e]/50 px-2 py-1 text-xs outline-none"
                      >
                        {AGENTS.filter((a) => a.id !== 'main').map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.emoji} {a.name}
                          </option>
                        ))}
                      </select>
                      <div className="flex gap-1 justify-end">
                        <button
                          onClick={() => updateTask(t.id, { status: 'todo' })}
                          className={
                            'text-[11px] px-2 py-1 rounded-full ' +
                            (t.status === 'todo'
                              ? 'bg-coral-500/15 text-coral-700 dark:text-coral-200'
                              : 'bg-black/5 dark:bg-white/10 text-gray-700 dark:text-gray-200')
                          }
                        >
                          T
                        </button>
                        <button
                          onClick={() => updateTask(t.id, { status: 'doing' })}
                          className={
                            'text-[11px] px-2 py-1 rounded-full ' +
                            (t.status === 'doing'
                              ? 'bg-coral-500/15 text-coral-700 dark:text-coral-200'
                              : 'bg-black/5 dark:bg-white/10 text-gray-700 dark:text-gray-200')
                          }
                        >
                          D
                        </button>
                        <button
                          onClick={() => updateTask(t.id, { status: 'done' })}
                          className={
                            'text-[11px] px-2 py-1 rounded-full ' +
                            (t.status === 'done'
                              ? 'bg-coral-500/15 text-coral-700 dark:text-coral-200'
                              : 'bg-black/5 dark:bg-white/10 text-gray-700 dark:text-gray-200')
                          }
                        >
                          ✓
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        ))}
      </div>

      <div className="text-[11px] text-gray-500 dark:text-gray-400 pb-6">
        Tip: drag cards between columns. Keep “Doing” small so you actually finish.
      </div>
    </div>
  );
}
