import { loadJSON, saveJSON } from './storage';
import { isoDate, lastNDays } from './dates';
import type { AgentId } from './agents';

export type HabitId = string;

export interface Habit {
  id: HabitId;
  title: string;
  emoji?: string;
}

export interface MetricEntry {
  date: string; // yyyy-mm-dd
  weightKg?: number;
  sleepHours?: number;
}

export type BillFrequency = 'monthly' | 'once';

export interface Bill {
  id: string;
  title: string;
  amountUsd: number;
  frequency: BillFrequency;
  // monthly bills
  dueDay?: number; // 1-31
  lastPaidYm?: string; // yyyy-MM
  // one-time bills
  dueDate?: string; // yyyy-MM-dd
  paid?: boolean;
}

export interface DailyCheckin {
  date: string; // yyyy-mm-dd
  caloriesKcal?: number;
  trainingMin?: number;
  smoked?: boolean;
  tradesCount?: number;
  tradeLogDone?: boolean;
  amPrepDone?: boolean;
  pmShutdownDone?: boolean;
}

export type TaskStatus = 'todo' | 'doing' | 'done';

export interface AgentTask {
  id: string;
  title: string;
  assignedTo: AgentId;
  status: TaskStatus;
  createdAt: string; // iso
}

export interface AppData {
  habits: Habit[];
  habitCompletions: Record<HabitId, Record<string, boolean>>; // habitId -> date -> done
  metrics: MetricEntry[];
  checkins: DailyCheckin[];
  bills: Bill[];
  agentTasks: AgentTask[];
}

const KEY = 'dima_os_data_v2';

export const DEFAULT_HABITS: Habit[] = [
  { id: 'sleep_22', title: 'Sleep by 22:00', emoji: '🛌' },
  { id: 'kcal_3100', title: '3100 kcal', emoji: '🍽️' },
  { id: 'training', title: 'Training', emoji: '🏋️' },
  { id: 'no_smoking', title: 'No smoking', emoji: '🚭' },
  { id: 'max_2_trades', title: '≤ 2 trades', emoji: '📈' },
  { id: 'trade_log', title: 'Trade log done', emoji: '🧾' },
  { id: 'meal_prep', title: 'Meal prep', emoji: '🥗' },
];

export function loadAppData(): AppData {
  const fallback: AppData = { habits: DEFAULT_HABITS, habitCompletions: {}, metrics: [], checkins: [], bills: [], agentTasks: [] };
  const data = loadJSON<AppData>(KEY, fallback);

  // ensure fields exist
  if (!Array.isArray(data.habits)) data.habits = DEFAULT_HABITS;
  if (!data.habitCompletions) data.habitCompletions = {};
  if (!data.metrics) data.metrics = [];
  if (!data.checkins) data.checkins = [];
  if (!data.bills) data.bills = [];
  if (!data.agentTasks) data.agentTasks = [];

  return data;
}

export function saveAppData(data: AppData) {
  saveJSON(KEY, data);
}

export function toggleHabitToday(data: AppData, habitId: HabitId, today = new Date()): AppData {
  const d = isoDate(today);
  const next: AppData = structuredClone(data);
  if (!next.habitCompletions[habitId]) next.habitCompletions[habitId] = {};
  next.habitCompletions[habitId][d] = !next.habitCompletions[habitId][d];
  return next;
}

export function habitStats(data: AppData, habitId: HabitId, today = new Date()) {
  const days30 = lastNDays(30, today);
  const map = data.habitCompletions[habitId] || {};
  const done30 = days30.filter((d) => map[d]).length;
  const done7 = days30.slice(-7).filter((d) => map[d]).length;

  // streak: consecutive days ending today
  let streak = 0;
  for (let i = days30.length - 1; i >= 0; i--) {
    const d = days30[i];
    if (map[d]) streak++;
    else break;
  }

  return {
    days30,
    map,
    done30,
    done7,
    pct30: Math.round((done30 / 30) * 100),
    pct7: Math.round((done7 / 7) * 100),
    streak,
  };
}

export function upsertMetricToday(data: AppData, entry: MetricEntry, today = new Date()): AppData {
  const d = isoDate(today);
  const next: AppData = structuredClone(data);
  const idx = next.metrics.findIndex((m) => m.date === d);
  if (idx >= 0) next.metrics[idx] = { ...next.metrics[idx], ...entry, date: d };
  else next.metrics.push({ ...entry, date: d });
  next.metrics.sort((a, b) => (a.date < b.date ? -1 : 1));
  return next;
}

export function upsertCheckinToday(data: AppData, entry: Omit<DailyCheckin, 'date'>, today = new Date()): AppData {
  const d = isoDate(today);
  const next: AppData = structuredClone(data);
  const idx = next.checkins.findIndex((c) => c.date === d);
  if (idx >= 0) next.checkins[idx] = { ...next.checkins[idx], ...entry, date: d };
  else next.checkins.push({ ...entry, date: d });
  next.checkins.sort((a, b) => (a.date < b.date ? -1 : 1));
  return next;
}

export function getTodayCheckin(data: AppData, today = new Date()): DailyCheckin | undefined {
  const d = isoDate(today);
  return data.checkins.find((c) => c.date === d);
}


export function seedIfEmpty(data: AppData, today = new Date()): AppData {
  // create lightweight demo data if empty so UI isn't blank.
  let next: AppData = data;

  if (next.metrics.length === 0) {
    const days = lastNDays(14, today);
    const baseW = 72;
    next = structuredClone(next);
    next.metrics = days.map((d, i) => ({
      date: d,
      weightKg: Math.round((baseW + Math.sin(i / 3) * 0.8) * 10) / 10,
      sleepHours: Math.round((7 + Math.cos(i / 2) * 0.7) * 10) / 10,
    }));
  }

  if (next.bills.length === 0) {
    next = structuredClone(next);
    next.bills = [
      { id: 'rent', title: 'Rent', amountUsd: 1500, frequency: 'monthly', dueDay: 1 },
      { id: 'car_ins', title: 'Car insurance', amountUsd: 150, frequency: 'monthly', dueDay: 5 },
      { id: 'phone', title: 'Phone', amountUsd: 85, frequency: 'monthly', dueDay: 10 },
    ];
  }

  if (next.checkins.length === 0) {
    next = structuredClone(next);
    next.checkins = [];
  }

  return next;
}
