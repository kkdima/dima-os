import { addMonths, format, getDate, parseISO, setDate } from 'date-fns';
import type { Bill } from './appData';

export interface UpcomingBill {
  id: string;
  title: string;
  amountUsd: number;
  dueDate: string; // yyyy-MM-dd
  kind: 'monthly' | 'once';
  paid: boolean;
}

function ym(d: Date) {
  return format(d, 'yyyy-MM');
}

export function billNextDueDate(bill: Bill, today = new Date()): Date | null {
  if (bill.frequency === 'once') {
    if (!bill.dueDate) return null;
    return parseISO(bill.dueDate);
  }

  const day = Math.min(Math.max(bill.dueDay ?? 1, 1), 31);
  const thisMonth = setDate(today, day);

  // if due date already passed this month, use next month
  const due = getDate(today) <= day ? thisMonth : addMonths(thisMonth, 1);
  return due;
}

export function isBillPaid(bill: Bill, due: Date): boolean {
  if (bill.frequency === 'once') return !!bill.paid;
  return bill.lastPaidYm === ym(due);
}

export function computeUpcomingBills(bills: Bill[], today = new Date()): UpcomingBill[] {
  const res: UpcomingBill[] = [];

  for (const b of bills) {
    const due = billNextDueDate(b, today);
    if (!due) continue;
    res.push({
      id: b.id,
      title: b.title,
      amountUsd: b.amountUsd,
      dueDate: format(due, 'yyyy-MM-dd'),
      kind: b.frequency,
      paid: isBillPaid(b, due),
    });
  }

  res.sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1));
  return res;
}

export function sumUpcoming(upcoming: UpcomingBill[], withinDays: number, today = new Date()): number {
  const t = parseISO(format(today, 'yyyy-MM-dd'));
  const ms = withinDays * 24 * 60 * 60 * 1000;
  const limit = new Date(t.getTime() + ms);

  return upcoming
    .filter((u) => {
      const d = parseISO(u.dueDate);
      return d <= limit && !u.paid;
    })
    .reduce((acc, u) => acc + (u.amountUsd || 0), 0);
}
