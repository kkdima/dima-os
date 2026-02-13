import type { AgentId } from '../lib/agents';
import type { MissionControlData } from '../lib/missionControl';

function iso(d: Date): string {
  return d.toISOString();
}

function hoursAgo(base: Date, hours: number): string {
  return iso(new Date(base.getTime() - hours * 60 * 60 * 1000));
}

function daysAgo(base: Date, days: number): string {
  return iso(new Date(base.getTime() - days * 24 * 60 * 60 * 1000));
}

export function missionControlSeed(today = new Date()): MissionControlData {
  const created3d = daysAgo(today, 3);
  const created2d = daysAgo(today, 2);
  const created1d = daysAgo(today, 1);
  const created4h = hoursAgo(today, 4);
  const created2h = hoursAgo(today, 2);

  const tasks = [
    {
      id: 'mc_task_model',
      title: 'Define Mission Control data model',
      description: 'Align agents + chat + tasks data types for OpenClaw.',
      status: 'doing' as const,
      priority: 'high' as const,
      assignedTo: 'software-dev' as AgentId,
      createdAt: created2d,
      updatedAt: created4h,
      tags: ['backend', 'data'],
      comments: [
        {
          id: 'mc_comment_model',
          taskId: 'mc_task_model',
          authorId: 'coordinator' as AgentId,
          body: 'Keep task events minimal; we can extend later.',
          createdAt: created1d,
        },
      ],
      events: [
        {
          id: 'mc_event_model_created',
          taskId: 'mc_task_model',
          type: 'created' as const,
          actorId: 'coordinator' as AgentId,
          createdAt: created2d,
          meta: { toStatus: 'backlog' as const, toPriority: 'high' as const },
        },
        {
          id: 'mc_event_model_move',
          taskId: 'mc_task_model',
          type: 'status_changed' as const,
          actorId: 'software-dev' as AgentId,
          createdAt: created1d,
          meta: { fromStatus: 'backlog' as const, toStatus: 'doing' as const },
        },
      ],
    },
    {
      id: 'mc_task_digest',
      title: 'Draft daily digest format',
      description: 'Summarize moves, completions, and agent chat daily.',
      status: 'todo' as const,
      priority: 'normal' as const,
      assignedTo: 'researcher' as AgentId,
      createdAt: created3d,
      updatedAt: created2h,
      tags: ['summary'],
      comments: [],
      events: [
        {
          id: 'mc_event_digest_created',
          taskId: 'mc_task_digest',
          type: 'created' as const,
          actorId: 'main' as AgentId,
          createdAt: created3d,
          meta: { toStatus: 'todo' as const, toPriority: 'normal' as const },
        },
      ],
    },
    {
      id: 'mc_task_storage',
      title: 'Persist mission control data in app storage',
      description: 'Extend AppData without breaking existing views.',
      status: 'done' as const,
      priority: 'high' as const,
      assignedTo: 'notion-operator' as AgentId,
      createdAt: daysAgo(today, 5),
      updatedAt: created1d,
      tags: ['storage'],
      comments: [
        {
          id: 'mc_comment_storage',
          taskId: 'mc_task_storage',
          authorId: 'notion-operator' as AgentId,
          body: 'Seed data should be safe and lightweight.',
          createdAt: created1d,
        },
      ],
      events: [
        {
          id: 'mc_event_storage_created',
          taskId: 'mc_task_storage',
          type: 'created' as const,
          actorId: 'main' as AgentId,
          createdAt: daysAgo(today, 5),
          meta: { toStatus: 'backlog' as const, toPriority: 'high' as const },
        },
        {
          id: 'mc_event_storage_done',
          taskId: 'mc_task_storage',
          type: 'status_changed' as const,
          actorId: 'notion-operator' as AgentId,
          createdAt: created1d,
          meta: { fromStatus: 'doing' as const, toStatus: 'done' as const },
        },
      ],
    },
  ];

  const threads = [
    {
      id: 'mc_thread_main',
      agentId: 'main' as AgentId,
      title: 'Main Agent Thread',
      messages: [
        {
          id: 'mc_msg_main_1',
          threadId: 'mc_thread_main',
          senderId: 'user' as const,
          body: 'Can you summarize today’s task movement?',
          createdAt: created4h,
        },
        {
          id: 'mc_msg_main_2',
          threadId: 'mc_thread_main',
          senderId: 'main' as AgentId,
          body: 'Working on a compact digest now.',
          createdAt: created2h,
        },
      ],
      createdAt: created4h,
      updatedAt: created2h,
      lastReadAt: created4h,
    },
    {
      id: 'mc_thread_coordinator',
      agentId: 'coordinator' as AgentId,
      title: 'Coordinator Thread',
      messages: [
        {
          id: 'mc_msg_coord_1',
          threadId: 'mc_thread_coordinator',
          senderId: 'coordinator' as AgentId,
          body: 'Status change events are in place.',
          createdAt: created2h,
        },
      ],
      createdAt: created2h,
      updatedAt: created2h,
      lastReadAt: created2h,
    },
  ];

  const agentRuntime = [
    {
      agentId: 'main' as AgentId,
      state: 'busy' as const,
      updatedAt: created2h,
      note: 'Digest wiring',
    },
    {
      agentId: 'software-dev' as AgentId,
      state: 'idle' as const,
      updatedAt: created4h,
    },
    {
      agentId: 'researcher' as AgentId,
      state: 'blocked' as const,
      updatedAt: created1d,
      note: 'Awaiting specs',
    },
  ];

  return {
    tasks,
    threads,
    agentRuntime,
  };
}
