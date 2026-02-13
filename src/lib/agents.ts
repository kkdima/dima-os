export type AgentId =
  | 'main'
  | 'coordinator'
  | 'researcher'
  | 'notion-operator'
  | 'night-worker'
  | 'youtube-worker'
  | 'accountability-coach'
  | 'software-dev'
  | 'frontend-dev'
  | 'backend-dev'
  | 'devops'
  | 'designer'
  | 'qa'
  | 'product-manager'
  | 'data-analyst'
  | 'deep-researcher'
  | 'execution-watchdog';

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
    model: 'gpt-5.3-codex',
    focus: ['Breakdown', 'Routing', 'Non-overlap & locks'],
  },
  {
    id: 'researcher',
    name: 'Researcher',
    emoji: '🔎',
    title: 'Research Analyst',
    model: 'perplexity-research',
    focus: ['Fast research', 'Summaries', 'Options'],
  },
  {
    id: 'deep-researcher',
    name: 'Deep Researcher',
    emoji: '🧠',
    title: 'Deep Research',
    model: 'perplexity-deep',
    focus: ['Long-form research', 'Cross-source synthesis'],
  },
  {
    id: 'notion-operator',
    name: 'Notion Operator',
    emoji: '🗂️',
    title: 'Notion Ops',
    model: 'gpt-5.3-codex',
    focus: ['Databases', 'Logging', 'Inbox -> Notion'],
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
    model: 'gpt-5.3-codex',
    focus: ['Sleep/Food', 'Trading guardrails', 'Check-ins'],
  },
  {
    id: 'software-dev',
    name: 'Software Dev',
    emoji: '🛠️',
    title: 'Builder',
    model: 'gpt-5.3-codex',
    focus: ['Implements features', 'Fixes bugs', 'Deploys'],
  },
  {
    id: 'frontend-dev',
    name: 'Frontend Dev',
    emoji: '🎨',
    title: 'UI Engineer',
    model: 'gpt-5.3-codex',
    focus: ['UI', 'UX', 'Mobile polish'],
  },
  {
    id: 'backend-dev',
    name: 'Backend Dev',
    emoji: '🧱',
    title: 'API Engineer',
    model: 'gpt-5.3-codex',
    focus: ['Data model', 'Services', 'Integrations'],
  },
  {
    id: 'devops',
    name: 'DevOps',
    emoji: '⚙️',
    title: 'Infra',
    model: 'gpt-5.3-codex',
    focus: ['Pipelines', 'Deployments', 'Reliability'],
  },
  {
    id: 'designer',
    name: 'Designer',
    emoji: '✨',
    title: 'Product Design',
    model: 'gpt-5.3-codex',
    focus: ['Visual language', 'Interaction design'],
  },
  {
    id: 'qa',
    name: 'QA',
    emoji: '🧪',
    title: 'Quality Engineer',
    model: 'gpt-5.3-codex',
    focus: ['Regression checks', 'Edge cases', 'Sign-off'],
  },
  {
    id: 'product-manager',
    name: 'Product Manager',
    emoji: '📌',
    title: 'Product Lead',
    model: 'gpt-5.3-codex',
    focus: ['Scope', 'Priorities', 'Roadmap'],
  },
  {
    id: 'data-analyst',
    name: 'Data Analyst',
    emoji: '📊',
    title: 'Analytics',
    model: 'gpt-5.3-codex',
    focus: ['Metrics', 'Funnel analysis', 'Insights'],
  },
  {
    id: 'execution-watchdog',
    name: 'Execution Watchdog',
    emoji: '🚨',
    title: 'SLA Monitor',
    model: 'gpt-4o-mini',
    focus: ['Status cadence', 'Alerts', 'Escalation'],
  },
];

export function agentById(id: AgentId) {
  return AGENTS.find((a) => a.id === id);
}
