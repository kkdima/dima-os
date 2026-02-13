import { describe, it, expect } from 'vitest';
import type { AgentThread, MissionControlData } from '../missionControl';
import {
  createEmptyMissionControl,
  createTaskCard,
  moveTaskCard,
  getUnreadCounts,
  generateDailyDigest,
} from '../missionControl';

const DAY = '2026-02-10';

function iso(time: string) {
  return `${DAY}T${time}.000Z`;
}

describe('moveTaskCard', () => {
  it('moves status and records a status_changed event', () => {
    const initial = createTaskCard(createEmptyMissionControl(), {
      title: 'Prepare digest',
      status: 'todo',
      actorId: 'user',
      createdAt: iso('08:00:00'),
    });
    const taskId = initial.tasks[0].id;

    const moved = moveTaskCard(initial, taskId, 'doing', 'main', iso('10:00:00'));
    const task = moved.tasks[0];

    expect(task.status).toBe('doing');
    const lastEvent = task.events.at(-1);
    expect(lastEvent?.type).toBe('status_changed');
    expect(lastEvent?.meta).toMatchObject({ fromStatus: 'todo', toStatus: 'doing' });
  });
});

describe('getUnreadCounts', () => {
  it('counts only non-user messages after lastReadAt', () => {
    const threads: AgentThread[] = [
      {
        id: 'thread_main',
        agentId: 'main',
        title: 'Main',
        messages: [
          { id: 'm1', threadId: 'thread_main', senderId: 'user', body: 'hi', createdAt: iso('09:00:00') },
          { id: 'm2', threadId: 'thread_main', senderId: 'coordinator', body: 'update', createdAt: iso('10:00:00') },
        ],
        createdAt: iso('09:00:00'),
        updatedAt: iso('10:00:00'),
        lastReadAt: iso('09:30:00'),
      },
      {
        id: 'thread_research',
        agentId: 'researcher',
        title: 'Research',
        messages: [
          { id: 'm3', threadId: 'thread_research', senderId: 'researcher', body: 'note', createdAt: iso('08:00:00') },
          { id: 'm4', threadId: 'thread_research', senderId: 'user', body: 'ok', createdAt: iso('08:30:00') },
        ],
        createdAt: iso('08:00:00'),
        updatedAt: iso('08:30:00'),
      },
    ];

    const counts = getUnreadCounts(threads);
    expect(counts.total).toBe(2);
    expect(counts.byThreadId['thread_main']).toBe(1);
    expect(counts.byThreadId['thread_research']).toBe(1);
    expect(counts.byAgentId.main).toBe(1);
    expect(counts.byAgentId.researcher).toBe(1);
  });
});

describe('generateDailyDigest', () => {
  it('summarizes daily task activity, comments, and messages', () => {
    const data: MissionControlData = {
      tasks: [
        {
          id: 'task_a',
          title: 'Draft model',
          status: 'todo',
          priority: 'normal',
          createdAt: iso('07:00:00'),
          updatedAt: iso('07:00:00'),
          comments: [
            {
              id: 'comment_a',
              taskId: 'task_a',
              authorId: 'main',
              body: 'Initial draft',
              createdAt: iso('07:30:00'),
            },
          ],
          events: [],
        },
        {
          id: 'task_b',
          title: 'Storage wiring',
          status: 'done',
          priority: 'high',
          createdAt: '2026-02-09T10:00:00.000Z',
          updatedAt: iso('11:00:00'),
          comments: [],
          events: [
            {
              id: 'event_b1',
              taskId: 'task_b',
              type: 'status_changed',
              actorId: 'software-dev',
              createdAt: iso('11:00:00'),
              meta: { fromStatus: 'doing', toStatus: 'done' },
            },
          ],
        },
        {
          id: 'task_c',
          title: 'Digest summary',
          status: 'doing',
          priority: 'normal',
          createdAt: '2026-02-08T12:00:00.000Z',
          updatedAt: iso('12:00:00'),
          comments: [],
          events: [
            {
              id: 'event_c1',
              taskId: 'task_c',
              type: 'status_changed',
              actorId: 'coordinator',
              createdAt: iso('12:00:00'),
              meta: { fromStatus: 'backlog', toStatus: 'doing' },
            },
          ],
        },
      ],
      threads: [
        {
          id: 'thread_main',
          agentId: 'main',
          title: 'Main',
          messages: [
            {
              id: 'msg_1',
              threadId: 'thread_main',
              senderId: 'main',
              body: 'Digest ready',
              createdAt: iso('12:30:00'),
            },
          ],
          createdAt: iso('12:00:00'),
          updatedAt: iso('12:30:00'),
        },
      ],
      agentRuntime: [],
    };

    const digest = generateDailyDigest(data, new Date(`${DAY}T13:00:00.000Z`));
    expect(digest.tasksCreated).toBe(1);
    expect(digest.tasksMoved).toBe(2);
    expect(digest.tasksCompleted).toBe(1);
    expect(digest.commentsAdded).toBe(1);
    expect(digest.messagesSent).toBe(1);
  });
});
