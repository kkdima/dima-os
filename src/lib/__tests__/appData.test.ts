import { describe, it, expect } from 'vitest';
import {
  toggleHabitToday,
  addHabit,
  removeHabit,
  habitStats,
  upsertMetricToday,
  upsertCheckinToday,
  getTodayCheckin,
} from '../appData';
import type { AppData } from '../appData';

describe('toggleHabitToday', () => {
  it('toggles habit completion for today', () => {
    const data: AppData = {
      habits: [{ id: 'test', title: 'Test', emoji: '✅' }],
      habitCompletions: {},
      metrics: [],
      checkins: [],
      bills: [],
      agentTasks: [],
    };
    const today = new Date('2026-02-10T12:00:00');
    const todayKey = '2026-02-10';
    
    // Toggle on
    let result = toggleHabitToday(data, 'test', today);
    expect(result.habitCompletions['test'][todayKey]).toBe(true);
    
    // Toggle off
    result = toggleHabitToday(result, 'test', today);
    expect(result.habitCompletions['test'][todayKey]).toBe(false);
  });

  it('creates habitCompletions entry if missing', () => {
    const data: AppData = {
      habits: [{ id: 'test', title: 'Test' }],
      habitCompletions: {},
      metrics: [],
      checkins: [],
      bills: [],
      agentTasks: [],
    };
    const today = new Date('2026-02-10');
    const result = toggleHabitToday(data, 'test', today);
    expect(result.habitCompletions['test']).toBeDefined();
  });
});

describe('addHabit', () => {
  it('adds a new habit with title and emoji', () => {
    const data: AppData = {
      habits: [],
      habitCompletions: {},
      metrics: [],
      checkins: [],
      bills: [],
      agentTasks: [],
    };
    const result = addHabit(data, 'Exercise', '🏋️');
    expect(result.habits).toHaveLength(1);
    expect(result.habits[0].title).toBe('Exercise');
    expect(result.habits[0].emoji).toBe('🏋️');
  });

  it('defaults to ✅ emoji if not provided', () => {
    const data: AppData = {
      habits: [],
      habitCompletions: {},
      metrics: [],
      checkins: [],
      bills: [],
      agentTasks: [],
    };
    const result = addHabit(data, 'Exercise', '');
    expect(result.habits[0].emoji).toBe('✅');
  });

  it('trims whitespace from title', () => {
    const data: AppData = {
      habits: [],
      habitCompletions: {},
      metrics: [],
      checkins: [],
      bills: [],
      agentTasks: [],
    };
    const result = addHabit(data, '  Exercise  ', '🏋️');
    expect(result.habits[0].title).toBe('Exercise');
  });
});

describe('removeHabit', () => {
  it('removes habit from list', () => {
    const data: AppData = {
      habits: [{ id: 'test', title: 'Test' }],
      habitCompletions: {},
      metrics: [],
      checkins: [],
      bills: [],
      agentTasks: [],
    };
    const result = removeHabit(data, 'test');
    expect(result.habits).toHaveLength(0);
  });

  it('removes habit completions data', () => {
    const data: AppData = {
      habits: [{ id: 'test', title: 'Test' }],
      habitCompletions: { test: { '2026-02-10': true } },
      metrics: [],
      checkins: [],
      bills: [],
      agentTasks: [],
    };
    const result = removeHabit(data, 'test');
    expect(result.habitCompletions['test']).toBeUndefined();
  });
});

describe('habitStats', () => {
  it('calculates streak correctly', () => {
    const today = new Date('2026-02-10T12:00:00');
    const data: AppData = {
      habits: [{ id: 'test', title: 'Test' }],
      habitCompletions: {
        test: {
          '2026-02-08': true,
          '2026-02-09': true,
          '2026-02-10': true,
        },
      },
      metrics: [],
      checkins: [],
      bills: [],
      agentTasks: [],
    };
    const stats = habitStats(data, 'test', today);
    expect(stats.streak).toBe(3);
  });

  it('breaks streak when day is missed', () => {
    const today = new Date('2026-02-10T12:00:00');
    const data: AppData = {
      habits: [{ id: 'test', title: 'Test' }],
      habitCompletions: {
        test: {
          '2026-02-08': true,
          // Feb 9 missing
          '2026-02-10': true,
        },
      },
      metrics: [],
      checkins: [],
      bills: [],
      agentTasks: [],
    };
    const stats = habitStats(data, 'test', today);
    expect(stats.streak).toBe(1); // Only today
  });

  it('calculates 7-day percentage correctly', () => {
    const today = new Date('2026-02-10T12:00:00');
    const data: AppData = {
      habits: [{ id: 'test', title: 'Test' }],
      habitCompletions: {
        test: {
          '2026-02-04': true,
          '2026-02-05': true,
          '2026-02-06': true,
          '2026-02-07': true,
          // Feb 8 missing
          '2026-02-09': true,
          '2026-02-10': true,
        },
      },
      metrics: [],
      checkins: [],
      bills: [],
      agentTasks: [],
    };
    const stats = habitStats(data, 'test', today);
    expect(stats.pct7).toBe(86); // 6/7 ≈ 86%
  });
});

describe('upsertMetricToday', () => {
  it('adds new metric entry', () => {
    const data: AppData = {
      habits: [],
      habitCompletions: {},
      metrics: [],
      checkins: [],
      bills: [],
      agentTasks: [],
    };
    const today = new Date('2026-02-10T12:00:00');
    const result = upsertMetricToday(data, { date: '', weightKg: 72.5, sleepHours: 7.5 }, today);
    expect(result.metrics).toHaveLength(1);
    expect(result.metrics[0].weightKg).toBe(72.5);
    expect(result.metrics[0].sleepHours).toBe(7.5);
  });

  it('updates existing metric entry', () => {
    const data: AppData = {
      habits: [],
      habitCompletions: {},
      metrics: [{ date: '2026-02-10', weightKg: 70 }],
      checkins: [],
      bills: [],
      agentTasks: [],
    };
    const today = new Date('2026-02-10T12:00:00');
    const result = upsertMetricToday(data, { date: '', weightKg: 72 }, today);
    expect(result.metrics).toHaveLength(1);
    expect(result.metrics[0].weightKg).toBe(72);
  });
});

describe('upsertCheckinToday', () => {
  it('adds new checkin entry', () => {
    const data: AppData = {
      habits: [],
      habitCompletions: {},
      metrics: [],
      checkins: [],
      bills: [],
      agentTasks: [],
    };
    const today = new Date('2026-02-10T12:00:00');
    const result = upsertCheckinToday(data, { caloriesKcal: 3100, smoked: false }, today);
    expect(result.checkins).toHaveLength(1);
    expect(result.checkins[0].caloriesKcal).toBe(3100);
  });

  it('updates existing checkin entry', () => {
    const data: AppData = {
      habits: [],
      habitCompletions: {},
      metrics: [],
      checkins: [{ date: '2026-02-10', caloriesKcal: 3000 }],
      bills: [],
      agentTasks: [],
    };
    const today = new Date('2026-02-10T12:00:00');
    const result = upsertCheckinToday(data, { caloriesKcal: 3200 }, today);
    expect(result.checkins).toHaveLength(1);
    expect(result.checkins[0].caloriesKcal).toBe(3200);
  });
});

describe('getTodayCheckin', () => {
  it('returns today checkin if exists', () => {
    const data: AppData = {
      habits: [],
      habitCompletions: {},
      metrics: [],
      checkins: [{ date: '2026-02-10', caloriesKcal: 3100 }],
      bills: [],
      agentTasks: [],
    };
    const today = new Date('2026-02-10T12:00:00');
    const result = getTodayCheckin(data, today);
    expect(result).toBeDefined();
    expect(result?.caloriesKcal).toBe(3100);
  });

  it('returns undefined if no today checkin', () => {
    const data: AppData = {
      habits: [],
      habitCompletions: {},
      metrics: [],
      checkins: [{ date: '2026-02-09', caloriesKcal: 3100 }],
      bills: [],
      agentTasks: [],
    };
    const today = new Date('2026-02-10T12:00:00');
    const result = getTodayCheckin(data, today);
    expect(result).toBeUndefined();
  });
});
