import type { AppData } from './appData';
import { getTodayCheckin } from './appData';
import { computeUpcomingBills } from './bills';
import { parseISO, startOfDay } from 'date-fns';

export type RuleLevel = 'ok' | 'warn' | 'block';

export interface RuleResult {
  id: string;
  label: string;
  level: RuleLevel;
  details?: string;
}

export function evaluateTodayRules(data: AppData, today = new Date()): RuleResult[] {
  const checkin = getTodayCheckin(data, today);
  const sleep = data.metrics.at(-1)?.sleepHours;
  const trades = checkin?.tradesCount ?? 0;
  const tradeLogDone = !!checkin?.tradeLogDone;
  const bills = computeUpcomingBills(data.bills, today);
  const todayStart = startOfDay(today);
  const dueTodayUnpaid = bills.filter((b) => {
    const d = startOfDay(parseISO(b.dueDate));
    return d.getTime() === todayStart.getTime() && !b.paid;
  });

  return [
    {
      id: 'max_2_trades',
      label: 'Max 2 trades',
      level: trades > 2 ? 'block' : 'ok',
      details: `${trades}/2 today`,
    },
    {
      id: 'trade_log',
      label: 'Trade log done',
      level: trades > 0 && !tradeLogDone ? 'block' : 'ok',
      details: trades > 0 ? (tradeLogDone ? 'logged' : 'missing') : 'no trades yet',
    },
    {
      id: 'sleep_guard',
      label: 'Sleep guard',
      level: sleep !== undefined && sleep < 6 ? 'warn' : 'ok',
      details: sleep !== undefined ? `${sleep}h` : 'not logged',
    },
    {
      id: 'bills_today',
      label: 'Bills due today',
      level: dueTodayUnpaid.length > 0 ? 'block' : 'ok',
      details: dueTodayUnpaid.length > 0 ? `${dueTodayUnpaid.length} unpaid` : 'clear',
    },
  ];
}

export function aggregateDayStatus(results: RuleResult[]): 'GREEN' | 'YELLOW' | 'RED' {
  if (results.some((r) => r.level === 'block')) return 'RED';
  if (results.some((r) => r.level === 'warn')) return 'YELLOW';
  return 'GREEN';
}
