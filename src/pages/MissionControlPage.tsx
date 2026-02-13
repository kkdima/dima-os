import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AppData } from '../lib/appData';
import { AGENTS, type AgentId, type AgentProfile } from '../lib/agents';
import {
  createTaskCard,
  getThreadLastActivity,
  moveTaskCard,
  type AgentRuntimeState,
  type MissionControlData,
  type TaskCard,
  type TaskPriority,
  type TaskStatus,
} from '../lib/missionControl';
import { useDragAndDrop } from '../hooks/useDragAndDrop';
import {
  fetchOpenClawState,
  mapSessionToAgentId,
  type ConnectionStatus,
  type OpenClawSession,
} from '../lib/openclawApi';

type AgentStatus = AgentRuntimeState;

type MissionAgent = {
  id: AgentId;
  name: string;
  emoji: string;
  title: string;
  status: AgentStatus;
  lastActiveAt: string | null;
};

type MissionStatus = TaskStatus;

type Priority = TaskPriority;

type MissionTask = TaskCard;

const STATUS_ORDER: MissionStatus[] = ['backlog', 'todo', 'doing', 'blocked', 'done'];

const STATUS_LABEL: Record<MissionStatus, string> = {
  backlog: 'Backlog',
  todo: 'To Do',
  doing: 'In Progress',
  blocked: 'Blocked',
  done: 'Done',
};

const STATUS_STYLES: Record<MissionStatus, { dot: string; ring: string; headerBg: string }> = {
  backlog: {
    dot: 'bg-sky-500',
    ring: 'ring-sky-500/40',
    headerBg: 'bg-sky-50/80 dark:bg-sky-500/10',
  },
  todo: {
    dot: 'bg-indigo-500',
    ring: 'ring-indigo-500/40',
    headerBg: 'bg-indigo-50/80 dark:bg-indigo-500/10',
  },
  doing: {
    dot: 'bg-amber-500',
    ring: 'ring-amber-500/40',
    headerBg: 'bg-amber-50/80 dark:bg-amber-500/10',
  },
  blocked: {
    dot: 'bg-rose-500',
    ring: 'ring-rose-500/40',
    headerBg: 'bg-rose-50/80 dark:bg-rose-500/10',
  },
  done: {
    dot: 'bg-emerald-500',
    ring: 'ring-emerald-500/40',
    headerBg: 'bg-emerald-50/80 dark:bg-emerald-500/10',
  },
};

const AGENT_STATUS_LABEL: Record<AgentStatus, string> = {
  idle: 'Idle',
  busy: 'In Focus',
  blocked: 'Blocked',
  offline: 'Offline',
  error: 'Error',
};

const AGENT_STATUS_DOT: Record<AgentStatus, string> = {
  idle: 'bg-color-text-tertiary',
  busy: 'bg-amber-500',
  blocked: 'bg-rose-500',
  offline: 'bg-color-text-tertiary',
  error: 'bg-rose-600',
};

const PRIORITY_STYLE: Record<Priority, string> = {
  urgent: 'text-rose-600 dark:text-rose-300 bg-rose-500/15 dark:bg-rose-500/20',
  high: 'text-amber-600 dark:text-amber-300 bg-amber-500/10 dark:bg-amber-500/15',
  normal: 'text-sky-600 dark:text-sky-300 bg-sky-500/10 dark:bg-sky-500/15',
  low: 'text-color-text-tertiary bg-color-bg-secondary',
};

const CONNECTION_STATUS_STYLE: Record<ConnectionStatus, { dot: string; text: string }> = {
  connected: { dot: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-300' },
  connecting: { dot: 'bg-amber-400', text: 'text-amber-600 dark:text-amber-300' },
  disconnected: { dot: 'bg-color-text-tertiary', text: 'text-color-text-tertiary' },
  error: { dot: 'bg-rose-500', text: 'text-rose-600 dark:text-rose-300' },
};

const MISSION_STORAGE_KEY = 'ui.mission.v2'; // Bumped to v2 to clear old chat state

// Polling intervals (ms)
const SESSIONS_POLL_INTERVAL = 10_000;

type MissionPersistedState = {
  activeCol?: number;
};

function readMissionState(): MissionPersistedState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(MISSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed as MissionPersistedState;
  } catch {
    return null;
  }
}

function clampActiveCol(value: unknown) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  const rounded = Math.round(value);
  return Math.min(STATUS_ORDER.length - 1, Math.max(0, rounded));
}

function latestIso(values: Array<string | undefined>) {
  let latest: string | null = null;
  let latestTs = -1;
  for (const value of values) {
    if (!value) continue;
    const ts = new Date(value).getTime();
    if (Number.isNaN(ts)) continue;
    if (ts > latestTs) {
      latestTs = ts;
      latest = value;
    }
  }
  return latest;
}

// Build agent status from real OpenClaw sessions + persisted data
function buildMissionAgents(
  agents: AgentProfile[],
  data: MissionControlData,
  openclawSessions: OpenClawSession[],
): MissionAgent[] {
  const runtimeByAgent = new Map(data.agentRuntime.map((entry) => [entry.agentId, entry]));
  const threadByAgent = new Map(data.threads.map((thread) => [thread.agentId, thread]));

  // Map sessions to agent IDs for real-time status
  const sessionByAgent = new Map<AgentId, OpenClawSession>();
  for (const session of openclawSessions) {
    const agentId = mapSessionToAgentId(session);
    if (agentId) {
      sessionByAgent.set(agentId as AgentId, session);
    }
  }

  return agents.map((agent) => {
    const runtime = runtimeByAgent.get(agent.id);
    const thread = threadByAgent.get(agent.id);
    const session = sessionByAgent.get(agent.id);

    // Use real session status if available, fallback to persisted runtime
    let status: AgentStatus = runtime?.state ?? 'offline';
    let lastActiveAt = latestIso([
      runtime?.updatedAt,
      thread ? getThreadLastActivity(thread) : undefined,
    ]);

    if (session) {
      // Map session status to agent runtime status
      if (session.status === 'active') {
        status = 'busy';
      } else if (session.status === 'idle') {
        status = 'idle';
      }
      // Use session activity time
      lastActiveAt = latestIso([session.lastActivityAt, lastActiveAt ?? undefined]);
    }

    return {
      id: agent.id,
      name: agent.name,
      emoji: agent.emoji,
      title: agent.title,
      status,
      lastActiveAt,
    };
  });
}

function formatTimeAgo(now: number, iso?: string | null) {
  if (!iso) return 'no activity';
  const diff = Math.max(0, now - new Date(iso).getTime());
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function getAdjacentStatus(status: MissionStatus, direction: -1 | 1) {
  const idx = STATUS_ORDER.indexOf(status);
  const next = STATUS_ORDER[idx + direction];
  return next ?? status;
}

export function MissionControlPage({ data, onChange }: { data: AppData; onChange: (d: AppData) => void }) {
  const initialPersisted = readMissionState();
  const initialActiveCol = clampActiveCol(initialPersisted?.activeCol);

  const [now, setNow] = useState(() => Date.now());
  const [draftTitle, setDraftTitle] = useState('');
  const [draftStatus, setDraftStatus] = useState<MissionStatus>('backlog');
  const [draftAssignee, setDraftAssignee] = useState<AgentId | 'unassigned'>('unassigned');
  const [draftPriority, setDraftPriority] = useState<Priority>('normal');
  const [dragActiveId, setDragActiveId] = useState<string | null>(null);
  const [activeCol, setActiveCol] = useState(initialActiveCol);

  // Real-time OpenClaw state
  const [openclawState, setOpenclawState] = useState<{
    sessions: OpenClawSession[];
    lastUpdated: string;
    connectionStatus: ConnectionStatus;
  }>({
    sessions: [],
    lastUpdated: new Date().toISOString(),
    connectionStatus: 'disconnected',
  });

  const dataRef = useRef(data);
  const scrollRef = useRef<HTMLDivElement>(null);
  const initialScrollApplied = useRef(false);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  // Cleanup old storage keys on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      // Remove old chat/ui state that may contain fake data
      sessionStorage.removeItem('ui.mission');
      localStorage.removeItem('ui.mission');
    } catch {
      // Ignore storage errors
    }
  }, []);

  const missionControl = data.missionControl;
  const agents = useMemo(
    () => buildMissionAgents(AGENTS, missionControl, openclawState.sessions),
    [missionControl, openclawState.sessions],
  );
  const tasks = missionControl.tasks;

  const activeAgents = useMemo(
    () => agents.filter((agent) => agent.status !== 'offline').length,
    [agents],
  );

  // Polling for real-time OpenClaw state
  useEffect(() => {
    let mounted = true;
    let sessionsInterval: number | null = null;

    async function pollSessions() {
      try {
        const state = await fetchOpenClawState();
        if (!mounted) return;
        setOpenclawState({
          sessions: state.sessions,
          lastUpdated: state.lastUpdated,
          connectionStatus: state.connected ? 'connected' : 'error',
        });
      } catch {
        if (!mounted) return;
        setOpenclawState((prev) => ({
          ...prev,
          connectionStatus: 'error',
        }));
      }
    }

    async function initialPoll() {
      setOpenclawState((prev) => ({ ...prev, connectionStatus: 'connecting' }));
      await pollSessions();
    }

    initialPoll();

    sessionsInterval = window.setInterval(pollSessions, SESSIONS_POLL_INTERVAL);

    return () => {
      mounted = false;
      if (sessionsInterval) window.clearInterval(sessionsInterval);
    };
  }, []);

  // Visibility change handler - refresh on focus
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        fetchOpenClawState().then((state) => {
          setOpenclawState({
            sessions: state.sessions,
            lastUpdated: state.lastUpdated,
            connectionStatus: state.connected ? 'connected' : 'error',
          });
        });
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.setItem(
        MISSION_STORAGE_KEY,
        JSON.stringify({
          activeCol,
        }),
      );
    } catch {
      // Ignore storage failures
    }
  }, [activeCol]);

  useEffect(() => {
    if (initialScrollApplied.current) return;
    const el = scrollRef.current;
    if (!el) return;
    initialScrollApplied.current = true;
    requestAnimationFrame(() => {
      const width = el.scrollWidth;
      if (!width) return;
      const colWidth = width / STATUS_ORDER.length;
      el.scrollLeft = colWidth * activeCol;
    });
  }, [activeCol]);

  const updateMissionControl = useCallback(
    (updater: (current: MissionControlData) => MissionControlData) => {
      const current = dataRef.current;
      const nextMission = updater(current.missionControl);
      if (nextMission === current.missionControl) return;
      const next = structuredClone(current);
      next.missionControl = nextMission;
      onChange(next);
    },
    [onChange],
  );

  const byStatus = useMemo(() => {
    const map = new Map<MissionStatus, MissionTask[]>();
    for (const status of STATUS_ORDER) map.set(status, []);
    for (const task of tasks) map.get(task.status)?.push(task);
    for (const status of STATUS_ORDER) {
      map.get(status)?.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
    }
    return map;
  }, [tasks]);

  const moveTask = useCallback((id: string, direction: -1 | 1) => {
    const task = tasks.find((entry) => entry.id === id);
    if (!task) return;
    const nextStatus = getAdjacentStatus(task.status, direction);
    if (nextStatus === task.status) return;
    updateMissionControl((current) => moveTaskCard(current, id, nextStatus, 'user'));
  }, [tasks, updateMissionControl]);

  const addTask = useCallback(() => {
    const title = draftTitle.trim();
    if (!title) return;
    updateMissionControl((current) =>
      createTaskCard(current, {
        title,
        status: draftStatus,
        priority: draftPriority,
        assignedTo: draftAssignee === 'unassigned' ? undefined : draftAssignee,
        actorId: 'user',
      }),
    );
    setDraftTitle('');
  }, [draftTitle, draftStatus, draftAssignee, draftPriority, updateMissionControl]);

  const { cardProps, isDragging } = useDragAndDrop({
    onDragStart: (id) => setDragActiveId(id),
    onDragEnd: (id, dropTarget) => {
      if (dropTarget && STATUS_ORDER.includes(dropTarget as MissionStatus)) {
        updateMissionControl((current) =>
          moveTaskCard(current, id, dropTarget as MissionStatus, 'user'),
        );
      }
      setDragActiveId(null);
    },
  });

  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const colWidth = el.scrollWidth / STATUS_ORDER.length;
    const idx = Math.round(el.scrollLeft / colWidth);
    setActiveCol(Math.min(STATUS_ORDER.length - 1, Math.max(0, idx)));
  }, []);

  const connStyle = CONNECTION_STATUS_STYLE[openclawState.connectionStatus];

  return (
    <div className="mx-auto max-w-[1440px] 2xl:max-w-[1560px] px-4 pt-4 pb-safe-nav">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-color-text-primary">Mission Control</h1>
          <p className="text-xs text-color-text-tertiary mt-0.5">
            Live ops view - {tasks.length} tasks - {activeAgents} agents active
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${connStyle.text}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${connStyle.dot} ${openclawState.connectionStatus === 'connected' ? 'animate-pulse' : ''}`} />
            {openclawState.connectionStatus === 'connected' ? 'Live sync' : openclawState.connectionStatus}
          </span>
          <span className="text-[11px] text-color-text-tertiary">
            Updated {formatTimeAgo(now, openclawState.lastUpdated)}
          </span>
        </div>
      </div>

      <section className="mt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-color-text-tertiary">Agents</h2>
        </div>
        <div className="mt-3 -mx-4 px-4 pb-2 flex gap-3 overflow-x-auto scrollbar-none">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className="min-w-[200px] flex-1 rounded-2xl border border-color-border bg-color-card-secondary px-3 py-3"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-color-bg-secondary text-lg">
                  {agent.emoji}
                </div>
                <div>
                  <div className="text-sm font-semibold text-color-text-primary">{agent.name}</div>
                  <div className="text-xs text-color-text-tertiary">{agent.title}</div>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-color-text-tertiary">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${AGENT_STATUS_DOT[agent.status]}`} />
                  <span>{AGENT_STATUS_LABEL[agent.status]}</span>
                </div>
                <span>{formatTimeAgo(now, agent.lastActiveAt)}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-5">
        <section className="rounded-3xl border border-color-border bg-color-card-secondary p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-color-text-tertiary">Quick Task</h2>
            <span className="text-xs text-color-text-tertiary">Create + route</span>
          </div>
          <form
            className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]"
            onSubmit={(e) => {
              e.preventDefault();
              addTask();
            }}
          >
            <input
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              placeholder="New task brief..."
              className="rounded-2xl border border-color-border bg-color-card-secondary px-3 py-2 text-sm text-color-text-primary placeholder:text-color-text-tertiary focus:outline-none focus:ring-2 focus:ring-coral-500/40"
            />
            <div className="flex gap-2">
              <select
                value={draftStatus}
                onChange={(e) => setDraftStatus(e.target.value as MissionStatus)}
                className="flex-1 rounded-2xl border border-color-border bg-color-card-secondary px-3 py-2 text-xs text-color-text-secondary focus:outline-none"
              >
                {STATUS_ORDER.map((status) => (
                  <option key={status} value={status}>
                    {STATUS_LABEL[status]}
                  </option>
                ))}
              </select>
              <select
                value={draftAssignee}
                onChange={(e) => setDraftAssignee(e.target.value as AgentId | 'unassigned')}
                className="flex-1 rounded-2xl border border-color-border bg-color-card-secondary px-3 py-2 text-xs text-color-text-secondary focus:outline-none"
              >
                <option value="unassigned">Unassigned</option>
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name}
                  </option>
                ))}
              </select>
              <select
                value={draftPriority}
                onChange={(e) => setDraftPriority(e.target.value as Priority)}
                className="rounded-2xl border border-color-border bg-color-card-secondary px-3 py-2 text-xs text-color-text-secondary focus:outline-none"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
              <button
                type="submit"
                className="rounded-2xl bg-coral-500 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-coral-600"
              >
                Add
              </button>
            </div>
          </form>
        </section>

        <section className="mt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-color-text-tertiary">Mission Board</h2>
            <span className="text-xs text-color-text-tertiary">Drag or move cards</span>
          </div>
          <div
            ref={scrollRef}
            onScroll={onScroll}
            className="mt-3 -mx-4 px-4 overflow-x-auto scrollbar-none scroll-smooth md:mx-0 md:px-0"
          >
            <div className="grid grid-flow-col auto-cols-[88%] sm:auto-cols-[70%] lg:auto-cols-[32%] xl:auto-cols-[24%] 2xl:auto-cols-[19%] gap-3 snap-x snap-mandatory lg:snap-none pb-2">
              {STATUS_ORDER.map((status) => {
                const columnTasks = byStatus.get(status) ?? [];
                const style = STATUS_STYLES[status];
                return (
                  <section
                    key={status}
                    data-drop-status={status}
                    className={
                      'flex flex-col rounded-2xl border border-color-border bg-gray-50/70 dark:bg-white/[0.03] min-h-[220px] transition-shadow duration-200 snap-start ' +
                      `[&.drop-highlight]:ring-2 ${style.ring}`
                    }
                  >
                    <div
                      className={
                        'flex items-center justify-between px-4 py-3 rounded-t-2xl border-b border-color-border ' +
                        style.headerBg
                      }
                    >
                      <div className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${style.dot}`} />
                        <h3 className="text-sm font-bold tracking-tight text-color-text-primary">
                          {STATUS_LABEL[status]}
                        </h3>
                      </div>
                      <span className="inline-flex min-w-[22px] items-center justify-center rounded-full bg-color-bg-secondary px-2 text-xs font-semibold text-color-text-secondary dark:text-color-text-tertiary">
                        {columnTasks.length}
                      </span>
                    </div>
                    <div className="flex-1 space-y-2 px-3 py-3">
                      {columnTasks.map((task) => {
                        const assignedAgent = agents.find((agent) => agent.id === task.assignedTo);
                        const tags = task.tags ?? [];
                        const isActive = isDragging(task.id) || dragActiveId === task.id;
                        const prevStatus = STATUS_ORDER.indexOf(task.status) > 0;
                        const nextStatus = STATUS_ORDER.indexOf(task.status) < STATUS_ORDER.length - 1;
                        return (
                          <div
                            key={task.id}
                            {...cardProps(task.id)}
                            className={
                              'rounded-2xl border border-color-border bg-color-card px-3 py-3 text-sm transition-shadow ' +
                              (isActive ? 'shadow-lg ring-2 ring-coral-500/40' : 'shadow-sm')
                            }
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="text-sm font-semibold text-color-text-primary">{task.title}</div>
                                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-color-text-tertiary">
                                  {assignedAgent ? (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-color-bg-secondary px-2 py-0.5">
                                      {assignedAgent.emoji} {assignedAgent.name}
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-color-bg-secondary px-2 py-0.5">
                                      Unassigned
                                    </span>
                                  )}
                                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 ${PRIORITY_STYLE[task.priority]}`}>
                                    {task.priority}
                                  </span>
                                </div>
                              </div>
                              <span className="text-[11px] text-color-text-tertiary">
                                {formatTimeAgo(now, task.updatedAt)}
                              </span>
                            </div>
                            {tags.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1 text-[11px] text-color-text-tertiary">
                                {tags.map((tag) => (
                                  <span key={tag} className="rounded-full border border-color-border px-2 py-0.5">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                            <div className="mt-3 flex items-center justify-between">
                              <div className="text-[11px] text-color-text-tertiary">Hold to drag</div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  disabled={!prevStatus}
                                  onClick={() => moveTask(task.id, -1)}
                                  className={
                                    'rounded-lg border px-2 py-1 text-[11px] font-semibold ' +
                                    (prevStatus
                                      ? 'border-color-border text-color-text-secondary'
                                      : 'border-transparent text-color-text-tertiary')
                                  }
                                >
                                  Prev
                                </button>
                                <button
                                  type="button"
                                  disabled={!nextStatus}
                                  onClick={() => moveTask(task.id, 1)}
                                  className={
                                    'rounded-lg border px-2 py-1 text-[11px] font-semibold ' +
                                    (nextStatus
                                      ? 'border-color-border text-color-text-secondary'
                                      : 'border-transparent text-color-text-tertiary')
                                  }
                                >
                                  Next
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {columnTasks.length === 0 && (
                        <div className="rounded-xl border border-dashed border-color-border px-3 py-4 text-center text-xs text-color-text-tertiary">
                          No tasks yet
                        </div>
                      )}
                    </div>
                  </section>
                );
              })}
            </div>
          </div>
          <div className="mt-3 flex justify-center gap-1.5 md:hidden">
            {STATUS_ORDER.map((status, i) => (
              <div
                key={status}
                className={
                  'h-1.5 rounded-full transition-all duration-200 ' +
                  (i === activeCol
                    ? 'w-5 bg-color-text-primary'
                    : 'w-1.5 bg-color-bg-secondary')
                }
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}