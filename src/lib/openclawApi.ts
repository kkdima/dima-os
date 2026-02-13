// OpenClaw Gateway API client for real-time agent session and cron monitoring

const GATEWAY_URL = import.meta.env.VITE_OPENCLAW_GATEWAY_URL || 'http://localhost:8080';

export interface OpenClawSession {
  sessionId: string;
  agent: string;
  channel: string;
  startedAt: string;
  lastActivityAt: string;
  status: 'active' | 'idle' | 'paused';
  requestCount: number;
  model?: string;
}

export interface OpenClawCronJob {
  id: string;
  name: string;
  schedule: string;
  lastRunAt?: string;
  lastStatus?: 'success' | 'error' | 'running' | 'pending';
  nextRunAt?: string;
  enabled: boolean;
}

export interface OpenClawState {
  sessions: OpenClawSession[];
  cronJobs: OpenClawCronJob[];
  lastUpdated: string;
  connected: boolean;
}

export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'error';

async function fetchSessions(): Promise<OpenClawSession[]> {
  try {
    const response = await fetch(`${GATEWAY_URL}/api/sessions`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return Array.isArray(data) ? data : data.sessions || [];
  } catch {
    // Fallback: try the openclaw sessions_list endpoint format
    try {
      const response = await fetch(`${GATEWAY_URL}/sessions`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });
      if (!response.ok) return [];
      const data = await response.json();
      return Array.isArray(data) ? data : data.sessions || [];
    } catch {
      return [];
    }
  }
}

async function fetchCronJobs(): Promise<OpenClawCronJob[]> {
  try {
    const response = await fetch(`${GATEWAY_URL}/api/cron`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return Array.isArray(data) ? data : data.jobs || [];
  } catch {
    // Fallback: try alternative endpoint
    try {
      const response = await fetch(`${GATEWAY_URL}/cron`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });
      if (!response.ok) return [];
      const data = await response.json();
      return Array.isArray(data) ? data : data.jobs || [];
    } catch {
      return [];
    }
  }
}

export async function fetchOpenClawState(): Promise<OpenClawState> {
  try {
    const [sessions, cronJobs] = await Promise.all([
      fetchSessions(),
      fetchCronJobs(),
    ]);
    return {
      sessions,
      cronJobs,
      lastUpdated: new Date().toISOString(),
      connected: true,
    };
  } catch (error) {
    return {
      sessions: [],
      cronJobs: [],
      lastUpdated: new Date().toISOString(),
      connected: false,
    };
  }
}

export function getConnectionStatus(state: OpenClawState): ConnectionStatus {
  if (!state.connected) return 'disconnected';
  return 'connected';
}

// Map agent names/IDs to our known agent IDs
const AGENT_ID_MAPPING: Record<string, string> = {
  'codex': 'main',
  'codex-research': 'researcher',
  'codex-deep': 'deep-researcher',
  'gemini': 'coordinator',
  'gemini-pro': 'coordinator',
  'main': 'main',
  'coordinator': 'coordinator',
  'researcher': 'researcher',
  'notion-operator': 'notion-operator',
  'night-worker': 'night-worker',
  'youtube-worker': 'youtube-worker',
  'accountability-coach': 'accountability-coach',
  'software-dev': 'software-dev',
  'frontend-dev': 'frontend-dev',
  'backend-dev': 'backend-dev',
  'devops': 'devops',
  'designer': 'designer',
  'qa': 'qa',
  'product-manager': 'product-manager',
  'data-analyst': 'data-analyst',
  'execution-watchdog': 'execution-watchdog',
};

export function mapSessionToAgentId(session: OpenClawSession): string | null {
  // Try exact match first
  if (AGENT_ID_MAPPING[session.agent]) {
    return AGENT_ID_MAPPING[session.agent];
  }
  // Try partial match
  for (const [key, value] of Object.entries(AGENT_ID_MAPPING)) {
    if (session.agent.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }
  return null;
}
