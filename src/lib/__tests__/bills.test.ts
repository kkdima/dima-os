import { describe, it, expect } from 'vitest';
import { billNextDueDate, isBillPaid, computeUpcomingBills } from '../bills';
import type { Bill } from '../appData';
import { format, getDaysInMonth, parseISO } from 'date-fns';

describe('billNextDueDate', () => {
  it('returns correct date for one-time bill', () => {
    const bill: Bill = {
      id: 'test',
      title: 'Test',
      amountUsd: 100,
      frequency: 'once',
      dueDate: '2026-02-15',
    };
    const result = billNextDueDate(bill, new Date('2026-02-10'));
    expect(result).toEqual(parseISO('2026-02-15'));
  });

  it('handles monthly bill on same day', () => {
    const bill: Bill = {
      id: 'test',
      title: 'Rent',
      amountUsd: 1500,
      frequency: 'monthly',
      dueDay: 10,
    };
    const today = new Date('2026-02-05');
    const result = billNextDueDate(bill, today);
    expect(format(result!, 'yyyy-MM-dd')).toBe('2026-02-10');
  });

  it('handles monthly bill after due day', () => {
    const bill: Bill = {
      id: 'test',
      title: 'Rent',
      amountUsd: 1500,
      frequency: 'monthly',
      dueDay: 5,
    };
    const today = new Date('2026-02-10');
    const result = billNextDueDate(bill, today);
    expect(format(result!, 'yyyy-MM-dd')).toBe('2026-03-05');
  });

  it('clamps day to days in month (February edge case)', () => {
    const bill: Bill = {
      id: 'test',
      title: 'Bill',
      amountUsd: 100,
      frequency: 'monthly',
      dueDay: 31,
    };
    const today = new Date('2026-02-10');
    const result = billNextDueDate(bill, today);
    const daysInFeb = getDaysInMonth(today);
    expect(result!.getDate()).toBe(daysInFeb);
  });
});

describe('isBillPaid', () => {
  it('returns true for paid one-time bill', () => {
    const bill: Bill = {
      id: 'test',
      title: 'Test',
      amountUsd: 100,
      frequency: 'once',
      dueDate: '2026-02-15',
      paid: true,
    };
    expect(isBillPaid(bill, new Date('2026-02-15'))).toBe(true);
  });

  it('returns false for unpaid one-time bill', () => {
    const bill: Bill = {
      id: 'test',
      title: 'Test',
      amountUsd: 100,
      frequency: 'once',
      dueDate: '2026-02-15',
      paid: false,
    };
    expect(isBillPaid(bill, new Date('2026-02-15'))).toBe(false);
  });

  it('returns true for monthly bill paid this month', () => {
    const bill: Bill = {
      id: 'test',
      title: 'Rent',
      amountUsd: 1500,
      frequency: 'monthly',
      dueDay: 1,
      lastPaidYm: '2026-02',
    };
    // Due date is Feb 1st, bill was paid in Feb (2026-02)
    expect(isBillPaid(bill, parseISO('2026-02-01'))).toBe(true);
  });

  it('returns false for monthly bill not paid this month', () => {
    const bill: Bill = {
      id: 'test',
      title: 'Rent',
      amountUsd: 1500,
      frequency: 'monthly',
      dueDay: 1,
      lastPaidYm: '2026-01',
    };
    // Due date is Feb 1st, but bill was paid in Jan (2026-01), not Feb
    expect(isBillPaid(bill, parseISO('2026-02-01'))).toBe(false);
  });
});

describe('computeUpcomingBills', () => {
  it('sorts bills by due date', () => {
    const bills: Bill[] = [
      { id: '1', title: 'Later', amountUsd: 100, frequency: 'monthly', dueDay: 25 },
      { id: '2', title: 'Sooner', amountUsd: 50, frequency: 'monthly', dueDay: 5 },
    ];
    const today = new Date('2026-02-01');
    const result = computeUpcomingBills(bills, today);
    expect(result[0].title).toBe('Sooner');
    expect(result[1].title).toBe('Later');
  });

  it('filters out bills without due dates', () => {
    const bills: Bill[] = [
      { id: '1', title: 'Valid', amountUsd: 100, frequency: 'monthly', dueDay: 5 },
      { id: '2', title: 'No date', amountUsd: 50, frequency: 'once', dueDate: undefined },
    ];
    const today = new Date('2026-02-01');
    const result = computeUpcomingBills(bills, today);
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Valid');
  });
});
