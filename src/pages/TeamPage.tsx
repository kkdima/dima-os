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
  // stored on AppData as (data as any).agentTasks for backward compatibility
  const anyData = data as any;
  if (!Array.isArray(anyData.agentTasks)) return [];
  return anyData.agentTasks as AgentTask[];
}

function setTasks(data: AppData, tasks: AgentTask[]): AppData {
  const next: any = structuredClone(data);
  next.agentTasks = tasks;
  // write-through since TeamPage uses local mutations as well
  saveAppData(next);
  return next as AppData;
}

export function TeamPage({ data, onChange }: { data: AppData; onChange: (d: AppData) => void }) {
  const [agentFilter, setAgentFilter] = useState<AgentId | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [newTitle, setNewTitle] = useState('');
  const [newAssignedTo, setNewAssignedTo] = useState<AgentId>('coordinator');

  const tasks = getTasks(data);

  const visible = useMemo(() => {
    return tasks
      .filter((t) => (agentFilter === 'all' ? true : t.assignedTo === agentFilter))
      .filter((t) => (statusFilter === 'all' ? true : t.status === statusFilter))
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }, [tasks, agentFilter, statusFilter]);

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

  return (
    <div className="mx-auto max-w-xl px-4 pt-4 space-y-4">
      <Card>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Agents</div>
            <div className="text-xl font-bold">Team</div>
            <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              Think of this as your employee dashboard: org chart + task queue.
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="text-sm font-semibold">Org chart</div>
        <div className="mt-3 grid gap-3">
          <div className="rounded-2xl border border-black/5 dark:border-white/10 p-3 bg-white/50 dark:bg-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-coral-500/15 text-coral-700 dark:text-coral-200">
                  <span className="text-lg">{AGENTS[0].emoji}</span>
                </div>
                <div>
                  <div className="font-semibold">Sam</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">GM · delegates work · owns your DM</div>
                </div>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{AGENTS[0].model}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {AGENTS.filter((a) => a.id !== 'main').map((a) => (
              <div
                key={a.id}
                className="rounded-2xl border border-black/5 dark:border-white/10 p-3 bg-white/50 dark:bg-white/5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-black/5 dark:bg-white/10">
                      <span className="text-lg">{a.emoji}</span>
                    </div>
                    <div>
                      <div className="font-semibold leading-tight">{a.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{a.title}</div>
                    </div>
                  </div>
                  <div className="text-[11px] text-gray-500 dark:text-gray-400 text-right">{a.model}</div>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {a.focus.slice(0, 3).map((f) => (
                    <span
                      key={f}
                      className="text-[11px] px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-gray-700 dark:text-gray-200"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">Task queue</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Assign work like you would to employees.</div>
          </div>
        </div>

        <div className="mt-3 grid gap-2">
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="New task (e.g., 'Add Agents section to Dima OS')"
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
            <button
              onClick={addTask}
              className="rounded-2xl bg-coral-600 text-white py-2 font-semibold"
            >
              Assign
            </button>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2">
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
            <Segmented
              value={statusFilter}
              onChange={(v) => setStatusFilter(v as any)}
              options={[
                { value: 'all', label: 'All' },
                { value: 'todo', label: 'To-do' },
                { value: 'doing', label: 'Doing' },
                { value: 'done', label: 'Done' },
              ]}
            />
          </div>

          <div className="mt-3 space-y-2">
            {visible.length === 0 && (
              <div className="text-sm text-gray-500 dark:text-gray-400">No tasks. Assign one above.</div>
            )}

            {visible.map((t) => {
              const agent = AGENTS.find((a) => a.id === t.assignedTo);
              return (
                <div
                  key={t.id}
                  className="rounded-2xl border border-black/5 dark:border-white/10 p-3 bg-white/50 dark:bg-white/5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold">{t.title}</div>
                      <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Assigned to {agent?.emoji} {agent?.name}
                      </div>
                    </div>
                    <button
                      onClick={() => deleteTask(t.id)}
                      className="text-xs text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
                    >
                      Delete
                    </button>
                  </div>

                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => updateTask(t.id, { status: 'todo' })}
                      className={
                        'text-xs px-2 py-1 rounded-full ' +
                        (t.status === 'todo'
                          ? 'bg-coral-500/15 text-coral-700 dark:text-coral-200'
                          : 'bg-black/5 dark:bg-white/10 text-gray-700 dark:text-gray-200')
                      }
                    >
                      To-do
                    </button>
                    <button
                      onClick={() => updateTask(t.id, { status: 'doing' })}
                      className={
                        'text-xs px-2 py-1 rounded-full ' +
                        (t.status === 'doing'
                          ? 'bg-coral-500/15 text-coral-700 dark:text-coral-200'
                          : 'bg-black/5 dark:bg-white/10 text-gray-700 dark:text-gray-200')
                      }
                    >
                      Doing
                    </button>
                    <button
                      onClick={() => updateTask(t.id, { status: 'done' })}
                      className={
                        'text-xs px-2 py-1 rounded-full ' +
                        (t.status === 'done'
                          ? 'bg-coral-500/15 text-coral-700 dark:text-coral-200'
                          : 'bg-black/5 dark:bg-white/10 text-gray-700 dark:text-gray-200')
                      }
                    >
                      Done
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      <div className="text-[11px] text-gray-500 dark:text-gray-400 pb-6">
        “Working most of the time” = we keep a non-empty queue here, and Sam delegates tasks to the right employee.
      </div>
    </div>
  );
}
