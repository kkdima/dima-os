import { useMemo, useState } from 'react';
import { format, startOfDay, differenceInDays } from 'date-fns';
import { Card } from './ui/Card';
import type { AppData, Bill, BillFrequency } from '../lib/appData';
import { billNextDueDate, isBillPaid } from '../lib/bills';
import { uid } from '../lib/uid';

interface BillRow {
  bill: Bill;
  due: Date;
  paid: boolean;
  daysUntil: number;
}

export function BillsEditor({ data, onChange }: { data: AppData; onChange: (d: AppData) => void }) {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<BillFrequency>('monthly');
  const [dueDay, setDueDay] = useState('1');
  const [dueDate, setDueDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const today = startOfDay(new Date());

  const allBills: BillRow[] = useMemo(() => {
    return data.bills
      .map((b) => {
        const d = billNextDueDate(b, today);
        if (!d) return null;
        const paid = isBillPaid(b, d);
        const daysUntil = differenceInDays(startOfDay(d), today);
        return { bill: b, due: d, paid, daysUntil };
      })
      .filter((r): r is BillRow => r !== null)
      .sort((a, b) => a.daysUntil - b.daysUntil);
  }, [data.bills, today]);

  // Urgency buckets
  const dueToday = allBills.filter((r) => r.daysUntil === 0 && !r.paid);
  const dueTomorrow = allBills.filter((r) => r.daysUntil === 1 && !r.paid);
  const dueThisWeek = allBills.filter((r) => r.daysUntil >= 2 && r.daysUntil <= 7 && !r.paid);

  const addBill = () => {
    if (!title.trim()) return;
    const amt = Number(amount || '0');

    const bill: Bill =
      frequency === 'monthly'
        ? {
            id: uid(),
            title: title.trim(),
            amountUsd: amt,
            frequency,
            dueDay: Math.min(Math.max(Number(dueDay || '1'), 1), 31),
          }
        : {
            id: uid(),
            title: title.trim(),
            amountUsd: amt,
            frequency,
            dueDate,
            paid: false,
          };

    onChange({ ...data, bills: [...data.bills, bill] });
    setTitle('');
    setAmount('');
  };

  const removeBill = (id: string) => {
    onChange({ ...data, bills: data.bills.filter((b) => b.id !== id) });
  };

  const togglePaid = (b: Bill) => {
    const due = billNextDueDate(b, today);
    if (!due) return;
    const nextBills = data.bills.map((x) => {
      if (x.id !== b.id) return x;
      if (x.frequency === 'once') return { ...x, paid: !x.paid };
      const ym = format(due, 'yyyy-MM');
      return { ...x, lastPaidYm: x.lastPaidYm === ym ? undefined : ym };
    });
    onChange({ ...data, bills: nextBills });
  };

  const renderBillRow = (r: BillRow, showUrgency = false) => (
    <div key={r.bill.id} className="flex items-center justify-between gap-2 py-2 border-b border-black/5 dark:border-white/10 last:border-0">
      <button onClick={() => togglePaid(r.bill)} className="flex-1 text-left">
        <div className="font-semibold text-sm">{r.bill.title}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {showUrgency ? (
            <>
              Due: {format(r.due, 'MMM d')} · ${r.bill.amountUsd.toFixed(0)}
            </>
          ) : (
            <>
              Next: {format(r.due, 'MMM d')} · ${r.bill.amountUsd.toFixed(0)}
            </>
          )}
        </div>
      </button>
      <button
        onClick={() => togglePaid(r.bill)}
        className={
          'px-3 py-2 rounded-2xl text-xs font-semibold ' +
          (r.paid ? 'bg-black/5 dark:bg-white/10 text-gray-500' : 'bg-coral-500/15 text-coral-700 dark:text-coral-200')
        }
      >
        {r.paid ? 'Paid' : 'Pay'}
      </button>
      <button onClick={() => removeBill(r.bill.id)} className="px-3 py-2 rounded-2xl bg-black/5 dark:bg-white/10 text-xs">
        ✕
      </button>
    </div>
  );

  return (
    <div className="mt-3">
      <Card className="p-4">
        <div className="text-sm font-medium text-gray-600 dark:text-gray-300">Bills</div>
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Add upcoming bills and mark them paid. (All local)
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Name (e.g., Rent)"
            className="col-span-2 w-full rounded-2xl bg-black/5 dark:bg-white/10 px-3 py-2 outline-none"
          />
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="decimal"
            placeholder="Amount (USD)"
            className="w-full rounded-2xl bg-black/5 dark:bg-white/10 px-3 py-2 outline-none"
          />
          <select
            value={frequency}
            onChange={(e) => setFrequency(e.target.value as BillFrequency)}
            className="w-full rounded-2xl bg-black/5 dark:bg-white/10 px-3 py-2 outline-none"
          >
            <option value="monthly">Monthly</option>
            <option value="once">One-time</option>
          </select>

          {frequency === 'monthly' ? (
            <input
              value={dueDay}
              onChange={(e) => setDueDay(e.target.value)}
              inputMode="numeric"
              placeholder="Due day (1-31)"
              className="col-span-2 w-full rounded-2xl bg-black/5 dark:bg-white/10 px-3 py-2 outline-none"
            />
          ) : (
            <input
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              type="date"
              className="col-span-2 w-full rounded-2xl bg-black/5 dark:bg-white/10 px-3 py-2 outline-none"
            />
          )}
        </div>

        <button onClick={addBill} className="mt-3 w-full rounded-2xl bg-coral-500 text-white py-2 font-semibold">
          Add bill
        </button>

        {/* Urgency Buckets */}
        {dueToday.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wide">Due Today</span>
              <span className="text-xs text-gray-500">${dueToday.reduce((s, r) => s + r.bill.amountUsd, 0).toFixed(0)}</span>
            </div>
            <Card className="p-3 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
              {dueToday.map((r) => renderBillRow(r, true))}
            </Card>
          </div>
        )}

        {dueTomorrow.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wide">Due Tomorrow</span>
              <span className="text-xs text-gray-500">${dueTomorrow.reduce((s, r) => s + r.bill.amountUsd, 0).toFixed(0)}</span>
            </div>
            <Card className="p-3 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
              {dueTomorrow.map((r) => renderBillRow(r, true))}
            </Card>
          </div>
        )}

        {dueThisWeek.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold text-yellow-600 dark:text-yellow-400 uppercase tracking-wide">Due This Week</span>
              <span className="text-xs text-gray-500">${dueThisWeek.reduce((s, r) => s + r.bill.amountUsd, 0).toFixed(0)}</span>
            </div>
            <Card className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
              {dueThisWeek.map((r) => renderBillRow(r, true))}
            </Card>
          </div>
        )}

        {/* All Bills / Later */}
        <div className="mt-4">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">All Bills</div>
          <div className="flex flex-col">
            {allBills.length === 0 ? (
              <div className="text-sm text-gray-500 dark:text-gray-400 py-2">No bills yet.</div>
            ) : (
              allBills.map((r) => renderBillRow(r))
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
