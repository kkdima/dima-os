import type { AgentId } from './agents';
import { isoDate } from './dates';
import { uid } from './uid';
import type { OpenClawState } from './openclawApi';
export type { ConnectionStatus } from './openclawApi';

export type ActorId = AgentId | 'user' | 'system';

export type AgentRuntimeState = 'offline' | 'idle' | 'busy' | 'blocked' | 'error';

export interface AgentRuntimeStatus {
  agentId: AgentId;
  state: AgentRuntimeState;
  updatedAt: string; // iso
  note?: string;
  activeTaskId?: string;
}

export type TaskStatus = 'backlog' | 'todo' | 'doing' | 'blocked' | 'done';
export type TaskPriority = 'low' | 'normal' | 'high' | 'urgent';

export type TaskEventType =
  | 'created'
  | 'status_changed'
  | 'priority_changed'
  | 'assigned'
  | 'comment_added'
  | 'updated';

export interface TaskEventMeta {
  fromStatus?: TaskStatus;
  toStatus?: TaskStatus;
  fromPriority?: TaskPriority;
  toPriority?: TaskPriority;
  fromAssignee?: AgentId | null;
  toAssignee?: AgentId | null;
  commentId?: string;
  fields?: string[];
  [key: string]: unknown;
}

export interface TaskEvent {
  id: string;
  taskId: string;
  type: TaskEventType;
  actorId: ActorId;
  createdAt: string; // iso
  message?: string;
  meta?: TaskEventMeta;
}

export interface TaskComment {
  id: string;
  taskId: string;
  authorId: ActorId;
  body: string;
  createdAt: string; // iso
}

export interface TaskCard {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedTo?: AgentId;
  createdAt: string; // iso
  updatedAt: string; // iso
  dueDate?: string; // yyyy-MM-dd
  tags?: string[];
  comments: TaskComment[];
  events: TaskEvent[];
}

export interface AgentMessage {
  id: string;
  threadId: string;
  senderId: ActorId;
  body: string;
  createdAt: string; // iso
}

export interface AgentThread {
  id: string;
  agentId: AgentId;
  title: string;
  messages: AgentMessage[];
  createdAt: string; // iso
  updatedAt: string; // iso
  lastReadAt?: string; // iso
}

export interface MissionControlData {
  tasks: TaskCard[];
  threads: AgentThread[];
  agentRuntime: AgentRuntimeStatus[];
  openclaw?: OpenClawState;
}

export interface DailyDigest {
  date: string; // yyyy-MM-dd
  tasksCreated: number;
  tasksCompleted: number;
  tasksMoved: number;
  commentsAdded: number;
  messagesSent: number;
  summary: string;
}

const DEFAULT_TASK_STATUS: TaskStatus = 'backlog';
const DEFAULT_TASK_PRIORITY: TaskPriority = 'normal';

function nowIso(value?: string | Date) {
  if (!value) return new Date().toISOString();
  return typeof value === 'string' ? value : value.toISOString();
}

function dateKey(iso: string): string {
  return iso.slice(0, 10);
}

function latestIso(values: string[], fallback: string): string {
  if (values.length === 0) return fallback;
  let latest = fallback;
  let latestTs = new Date(fallback).getTime();
  for (const value of values) {
    const ts = new Date(value).getTime();
    if (ts > latestTs) {
      latestTs = ts;
      latest = value;
    }
  }
  return latest;
}

function normalizeTask(task: TaskCard): TaskCard {
  return {
    ...task,
    comments: Array.isArray(task.comments) ? task.comments : [],
    events: Array.isArray(task.events) ? task.events : [],
  };
}

function normalizeThread(thread: AgentThread): AgentThread {
  return {
    ...thread,
    messages: Array.isArray(thread.messages) ? thread.messages : [],
  };
}

export function createEmptyMissionControl(): MissionControlData {
  return {
    tasks: [],
    threads: [],
    agentRuntime: [],
    openclaw: {
      sessions: [],
      cronJobs: [],
      lastUpdated: new Date().toISOString(),
      connected: false,
    },
  };
}

export function normalizeMissionControl(raw?: MissionControlData | null): MissionControlData {
  if (!raw || typeof raw !== 'object') return createEmptyMissionControl();
  return {
    tasks: Array.isArray(raw.tasks) ? raw.tasks.map(normalizeTask) : [],
    threads: Array.isArray(raw.threads) ? raw.threads.map(normalizeThread) : [],
    agentRuntime: Array.isArray(raw.agentRuntime) ? raw.agentRuntime : [],
    openclaw: raw.openclaw || {
      sessions: [],
      cronJobs: [],
      lastUpdated: new Date().toISOString(),
      connected: false,
    },
  };
}

export interface CreateTaskInput {
  id?: string;
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignedTo?: AgentId;
  dueDate?: string;
  tags?: string[];
  actorId?: ActorId;
  createdAt?: string;
}

export function createTaskCard(data: MissionControlData, input: CreateTaskInput): MissionControlData {
  const next = structuredClone(data);
  const createdAt = nowIso(input.createdAt);
  const status = input.status ?? DEFAULT_TASK_STATUS;
  const priority = input.priority ?? DEFAULT_TASK_PRIORITY;
  const title = input.title.trim() || 'Untitled task';
  const id = input.id ?? `task_${uid()}`;

  const task: TaskCard = {
    id,
    title,
    description: input.description?.trim() || undefined,
    status,
    priority,
    assignedTo: input.assignedTo,
    createdAt,
    updatedAt: createdAt,
    dueDate: input.dueDate,
    tags: input.tags?.filter((t) => t.trim().length > 0),
    comments: [],
    events: [],
  };

  task.events.push({
    id: `event_${uid()}`,
    taskId: task.id,
    type: 'created',
    actorId: input.actorId ?? 'system',
    createdAt,
    meta: { toStatus: status, toPriority: priority, toAssignee: task.assignedTo ?? null },
  });

  next.tasks.push(task);
  return next;
}

export interface TaskUpdate {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  assignedTo?: AgentId | null;
  dueDate?: string | null;
  tags?: string[];
  actorId?: ActorId;
  updatedAt?: string;
}

export function updateTaskCard(data: MissionControlData, taskId: string, updates: TaskUpdate): MissionControlData {
  const next = structuredClone(data);
  const task = next.tasks.find((t) => t.id === taskId);
  if (!task) return data;

  const changes: TaskEventMeta = {};
  const fields: string[] = [];

  if (updates.title !== undefined) {
    const title = updates.title.trim() || task.title;
    if (title !== task.title) {
      task.title = title;
      fields.push('title');
    }
  }

  if (updates.description !== undefined) {
    const description = updates.description.trim() || undefined;
    if (description !== task.description) {
      task.description = description;
      fields.push('description');
    }
  }

  if (updates.priority !== undefined && updates.priority !== task.priority) {
    changes.fromPriority = task.priority;
    changes.toPriority = updates.priority;
    task.priority = updates.priority;
    fields.push('priority');
  }

  if (updates.assignedTo !== undefined) {
    const nextAssignee = updates.assignedTo ?? undefined;
    if (nextAssignee !== task.assignedTo) {
      changes.fromAssignee = task.assignedTo ?? null;
      changes.toAssignee = nextAssignee ?? null;
      task.assignedTo = nextAssignee;
      fields.push('assignedTo');
    }
  }

  if (updates.dueDate !== undefined) {
    const nextDue = updates.dueDate ?? undefined;
    if (nextDue !== task.dueDate) {
      task.dueDate = nextDue;
      fields.push('dueDate');
    }
  }

  if (updates.tags !== undefined) {
    const normalized = updates.tags.map((t) => t.trim()).filter((t) => t.length > 0);
    const current = task.tags ?? [];
    if (normalized.join('|') !== current.join('|')) {
      task.tags = normalized;
      fields.push('tags');
    }
  }

  if (fields.length === 0) return data;

  const updatedAt = nowIso(updates.updatedAt);
  task.updatedAt = updatedAt;

  task.events.push({
    id: `event_${uid()}`,
    taskId: task.id,
    type: 'updated',
    actorId: updates.actorId ?? 'system',
    createdAt: updatedAt,
    meta: { ...changes, fields },
  });

  return next;
}

export function moveTaskCard(
  data: MissionControlData,
  taskId: string,
  toStatus: TaskStatus,
  actorId: ActorId = 'system',
  movedAt?: string,
): MissionControlData {
  const next = structuredClone(data);
  const task = next.tasks.find((t) => t.id === taskId);
  if (!task) return data;
  if (task.status === toStatus) return data;

  const fromStatus = task.status;
  const updatedAt = nowIso(movedAt);
  task.status = toStatus;
  task.updatedAt = updatedAt;

  task.events.push({
    id: `event_${uid()}`,
    taskId: task.id,
    type: 'status_changed',
    actorId,
    createdAt: updatedAt,
    meta: { fromStatus, toStatus },
  });

  return next;
}

export interface TaskCommentInput {
  authorId: ActorId;
  body: string;
  createdAt?: string;
}

export function appendTaskComment(data: MissionControlData, taskId: string, input: TaskCommentInput): MissionControlData {
  const next = structuredClone(data);
  const task = next.tasks.find((t) => t.id === taskId);
  if (!task) return data;
  const body = input.body.trim();
  if (!body) return data;

  const createdAt = nowIso(input.createdAt);
  const comment: TaskComment = {
    id: `comment_${uid()}`,
    taskId: task.id,
    authorId: input.authorId,
    body,
    createdAt,
  };

  task.comments.push(comment);
  task.updatedAt = createdAt;
  task.events.push({
    id: `event_${uid()}`,
    taskId: task.id,
    type: 'comment_added',
    actorId: input.authorId,
    createdAt,
    meta: { commentId: comment.id },
  });

  return next;
}

export interface TaskEventInput {
  type: TaskEventType;
  actorId: ActorId;
  createdAt?: string;
  message?: string;
  meta?: TaskEventMeta;
}

export function appendTaskEvent(data: MissionControlData, taskId: string, input: TaskEventInput): MissionControlData {
  const next = structuredClone(data);
  const task = next.tasks.find((t) => t.id === taskId);
  if (!task) return data;

  const createdAt = nowIso(input.createdAt);
  task.events.push({
    id: `event_${uid()}`,
    taskId: task.id,
    type: input.type,
    actorId: input.actorId,
    createdAt,
    message: input.message,
    meta: input.meta,
  });
  task.updatedAt = createdAt;

  return next;
}

export interface AppendMessageInput {
  senderId: ActorId;
  body: string;
  createdAt?: string;
  threadTitle?: string;
}

export function appendAgentMessage(
  data: MissionControlData,
  agentId: AgentId,
  input: AppendMessageInput,
): MissionControlData {
  const next = structuredClone(data);
  const body = input.body.trim();
  if (!body) return data;

  const createdAt = nowIso(input.createdAt);
  let thread = next.threads.find((t) => t.agentId === agentId);

  if (!thread) {
    thread = {
      id: `thread_${uid()}`,
      agentId,
      title: input.threadTitle ?? `Thread: ${agentId}`,
      messages: [],
      createdAt,
      updatedAt: createdAt,
    };
    next.threads.push(thread);
  }

  thread.messages.push({
    id: `msg_${uid()}`,
    threadId: thread.id,
    senderId: input.senderId,
    body,
    createdAt,
  });
  thread.updatedAt = createdAt;

  return next;
}

export function markThreadRead(data: MissionControlData, threadId: string, readAt?: string): MissionControlData {
  const next = structuredClone(data);
  const thread = next.threads.find((t) => t.id === threadId);
  if (!thread) return data;

  const fallback = thread.messages.at(-1)?.createdAt ?? thread.updatedAt;
  thread.lastReadAt = readAt ?? fallback ?? nowIso();
  return next;
}

export function markAgentThreadRead(data: MissionControlData, agentId: AgentId, readAt?: string): MissionControlData {
  const thread = data.threads.find((t) => t.agentId === agentId);
  if (!thread) return data;
  return markThreadRead(data, thread.id, readAt);
}

export interface AgentRuntimeUpdate {
  state?: AgentRuntimeState;
  note?: string | null;
  activeTaskId?: string | null;
  updatedAt?: string;
}

export function upsertAgentRuntime(
  data: MissionControlData,
  agentId: AgentId,
  updates: AgentRuntimeUpdate,
): MissionControlData {
  const next = structuredClone(data);
  const updatedAt = nowIso(updates.updatedAt);
  let runtime = next.agentRuntime.find((entry) => entry.agentId === agentId);

  if (!runtime) {
    runtime = {
      agentId,
      state: updates.state ?? 'idle',
      updatedAt,
    };
    if (updates.note) runtime.note = updates.note;
    if (updates.activeTaskId) runtime.activeTaskId = updates.activeTaskId;
    next.agentRuntime.push(runtime);
    return next;
  }

  if (updates.state !== undefined) runtime.state = updates.state;
  if (updates.note !== undefined) runtime.note = updates.note ?? undefined;
  if (updates.activeTaskId !== undefined) runtime.activeTaskId = updates.activeTaskId ?? undefined;
  runtime.updatedAt = updatedAt;

  return next;
}

export function getThreadUnreadCount(thread: AgentThread): number {
  const cutoff = thread.lastReadAt ? new Date(thread.lastReadAt).getTime() : 0;
  return thread.messages.filter((m) => {
    if (m.senderId === 'user') return false;
    return new Date(m.createdAt).getTime() > cutoff;
  }).length;
}

export interface UnreadCounts {
  total: number;
  byThreadId: Record<string, number>;
  byAgentId: Partial<Record<AgentId, number>>;
}

export function getUnreadCounts(threads: AgentThread[]): UnreadCounts {
  const byThreadId: Record<string, number> = {};
  const byAgentId: Partial<Record<AgentId, number>> = {};
  let total = 0;

  for (const thread of threads) {
    const count = getThreadUnreadCount(thread);
    byThreadId[thread.id] = count;
    byAgentId[thread.agentId] = (byAgentId[thread.agentId] ?? 0) + count;
    total += count;
  }

  return { total, byThreadId, byAgentId };
}

export function getThreadLastActivity(thread: AgentThread): string {
  const lastMessage = latestIso(
    thread.messages.map((m) => m.createdAt),
    thread.updatedAt || thread.createdAt,
  );
  return lastMessage || thread.updatedAt || thread.createdAt;
}

export function sortThreadsByActivity(threads: AgentThread[]): AgentThread[] {
  return [...threads].sort((a, b) => {
    const aTs = new Date(getThreadLastActivity(a)).getTime();
    const bTs = new Date(getThreadLastActivity(b)).getTime();
    return bTs - aTs;
  });
}

export function generateDailyDigest(data: MissionControlData, day = new Date()): DailyDigest {
  const dayKey = isoDate(day);
  const tasksCreated = data.tasks.filter((t) => dateKey(t.createdAt) === dayKey).length;

  const allEvents = data.tasks.flatMap((t) => t.events);
  const statusEvents = allEvents.filter(
    (e) => e.type === 'status_changed' && dateKey(e.createdAt) === dayKey,
  );
  const tasksMoved = statusEvents.length;
  const tasksCompleted = statusEvents.filter((e) => e.meta?.toStatus === 'done').length;

  const commentsAdded = data.tasks
    .flatMap((t) => t.comments)
    .filter((c) => dateKey(c.createdAt) === dayKey).length;

  const messagesSent = data.threads
    .flatMap((t) => t.messages)
    .filter((m) => dateKey(m.createdAt) === dayKey).length;

  const summary = `${dayKey} · ${tasksCreated} new, ${tasksCompleted} done, ${tasksMoved} moves, ${commentsAdded} comments, ${messagesSent} msgs`;

  return {
    date: dayKey,
    tasksCreated,
    tasksCompleted,
    tasksMoved,
    commentsAdded,
    messagesSent,
    summary,
  };
}
