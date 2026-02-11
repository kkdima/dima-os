import { describe, it, expect } from 'vitest';
import { evaluateTodayRules, aggregateDayStatus } from '../rules';
import type { AppData } from '../appData';

describe('evaluateTodayRules', () => {
  const baseData: AppData = {
    habits: [],
    habitCompletions: {},
    metrics: [],
    checkins: [],
    bills: [],
    agentTasks: [],
  };

  it('blocks when trades > 2', () => {
    const data: AppData = {
      ...baseData,
      checkins: [{ date: '2026-02-10', tradesCount: 3 }],
    };
    const today = new Date('2026-02-10T12:00:00');
    const results = evaluateTodayRules(data, today);
    const tradeRule = results.find((r) => r.id === 'max_2_trades');
    expect(tradeRule?.level).toBe('block');
    expect(tradeRule?.details).toBe('3/2 today');
  });

  it('allows when trades <= 2', () => {
    const data: AppData = {
      ...baseData,
      checkins: [{ date: '2026-02-10', tradesCount: 2 }],
    };
    const today = new Date('2026-02-10T12:00:00');
    const results = evaluateTodayRules(data, today);
    const tradeRule = results.find((r) => r.id === 'max_2_trades');
    expect(tradeRule?.level).toBe('ok');
  });

  it('blocks when trade log is missing but trades exist', () => {
    const data: AppData = {
      ...baseData,
      checkins: [{ date: '2026-02-10', tradesCount: 1, tradeLogDone: false }],
    };
    const today = new Date('2026-02-10T12:00:00');
    const results = evaluateTodayRules(data, today);
    const logRule = results.find((r) => r.id === 'trade_log');
    expect(logRule?.level).toBe('block');
    expect(logRule?.details).toBe('missing');
  });

  it('allows trade log when no trades', () => {
    const data: AppData = {
      ...baseData,
      checkins: [{ date: '2026-02-10', tradesCount: 0, tradeLogDone: false }],
    };
    const today = new Date('2026-02-10');
    const results = evaluateTodayRules(data, today);
    const logRule = results.find((r) => r.id === 'trade_log');
    expect(logRule?.level).toBe('ok');
    expect(logRule?.details).toBe('no trades yet');
  });

  it('warns when sleep < 6 hours', () => {
    const data: AppData = {
      ...baseData,
      metrics: [{ date: '2026-02-10', sleepHours: 5 }],
    };
    const today = new Date('2026-02-10T12:00:00');
    const results = evaluateTodayRules(data, today);
    const sleepRule = results.find((r) => r.id === 'sleep_guard');
    expect(sleepRule?.level).toBe('warn');
    expect(sleepRule?.details).toBe('5h');
  });

  it('allows when sleep >= 6 hours', () => {
    const data: AppData = {
      ...baseData,
      metrics: [{ date: '2026-02-10', sleepHours: 7 }],
    };
    const today = new Date('2026-02-10T12:00:00');
    const results = evaluateTodayRules(data, today);
    const sleepRule = results.find((r) => r.id === 'sleep_guard');
    expect(sleepRule?.level).toBe('ok');
    expect(sleepRule?.details).toBe('7h');
  });

  it('blocks when bills due today are unpaid', () => {
    const data: AppData = {
      ...baseData,
      bills: [
        { id: 'rent', title: 'Rent', amountUsd: 1500, frequency: 'monthly', dueDay: 10 },
      ],
    };
    const today = new Date('2026-02-10T12:00:00');
    const results = evaluateTodayRules(data, today);
    const billsRule = results.find((r) => r.id === 'bills_today');
    expect(billsRule?.level).toBe('block');
  });

  it('allows when no bills due today', () => {
    const data: AppData = {
      ...baseData,
      bills: [
        { id: 'rent', title: 'Rent', amountUsd: 1500, frequency: 'monthly', dueDay: 15 },
      ],
    };
    const today = new Date('2026-02-10');
    const results = evaluateTodayRules(data, today);
    const billsRule = results.find((r) => r.id === 'bills_today');
    expect(billsRule?.level).toBe('ok');
    expect(billsRule?.details).toBe('clear');
  });
});

describe('aggregateDayStatus', () => {
  it('returns RED when any block rule exists', () => {
    const results = [
      { id: '1', label: 'A', level: 'ok' as const },
      { id: '2', label: 'B', level: 'block' as const },
      { id: '3', label: 'C', level: 'warn' as const },
    ];
    expect(aggregateDayStatus(results)).toBe('RED');
  });

  it('returns YELLOW when warn but no block', () => {
    const results = [
      { id: '1', label: 'A', level: 'ok' as const },
      { id: '2', label: 'B', level: 'warn' as const },
      { id: '3', label: 'C', level: 'ok' as const },
    ];
    expect(aggregateDayStatus(results)).toBe('YELLOW');
  });

  it('returns GREEN when all ok', () => {
    const results = [
      { id: '1', label: 'A', level: 'ok' as const },
      { id: '2', label: 'B', level: 'ok' as const },
    ];
    expect(aggregateDayStatus(results)).toBe('GREEN');
  });

  it('returns GREEN for empty results', () => {
    expect(aggregateDayStatus([])).toBe('GREEN');
  });
});
