export type AgentId =
  | 'main'
  | 'coordinator'
  | 'researcher'
  | 'notion-operator'
  | 'night-worker'
  | 'youtube-worker'
  | 'accountability-coach'
  | 'software-dev';

export interface AgentProfile {
  id: AgentId;
  name: string;
  emoji: string;
  title: string;
  model: string;
  focus: string[];
}

export const AGENTS: AgentProfile[] = [
  {
    id: 'main',
    name: 'Sam',
    emoji: '🔗',
    title: 'General Manager',
    model: 'gpt-5.3-codex',
    focus: ['Owns the DM', 'Delegates work', 'Ships final answers'],
  },
  {
    id: 'coordinator',
    name: 'Coordinator',
    emoji: '🧭',
    title: 'Project Coordinator',
    model: 'claude-sonnet-4 (Max)',
    focus: ['Breakdown', 'Routing', 'Non-overlap & locks'],
  },
  {
    id: 'researcher',
    name: 'Researcher',
    emoji: '🔎',
    title: 'Research Analyst',
    model: 'claude-haiku-4 (Max)',
    focus: ['Fast research', 'Summaries', 'Options'],
  },
  {
    id: 'notion-operator',
    name: 'Notion Operator',
    emoji: '🗂️',
    title: 'Notion Ops',
    model: 'gpt-5.3-codex',
    focus: ['Databases', 'Logging', 'Inbox → Notion'],
  },
  {
    id: 'night-worker',
    name: 'Night Worker',
    emoji: '🌙',
    title: 'Background Executor',
    model: 'gpt-5.3-codex',
    focus: ['Night loop', 'Backlog processing', 'Scheduled routines'],
  },
  {
    id: 'youtube-worker',
    name: 'YouTube Worker',
    emoji: '📺',
    title: 'Media Ops',
    model: 'gpt-5.3-codex',
    focus: ['Watch Later', 'Playlists', 'YouTube API'],
  },
  {
    id: 'accountability-coach',
    name: 'Accountability Coach',
    emoji: '✅',
    title: 'Coach',
    model: 'claude-haiku-4 (Max)',
    focus: ['Sleep/food', 'Trading guardrails', 'Check-ins'],
  },
  {
    id: 'software-dev',
    name: 'Software Dev',
    emoji: '🛠️',
    title: 'Builder',
    model: 'gpt-5.3-codex',
    focus: ['Implements features', 'Fixes bugs', 'Deploys'],
  },
];

export function agentById(id: AgentId) {
  return AGENTS.find((a) => a.id === id);
}
