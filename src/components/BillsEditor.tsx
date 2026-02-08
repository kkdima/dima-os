import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Card } from './ui/Card';
import type { AppData, Bill, BillFrequency } from '../lib/appData';
import { billNextDueDate, isBillPaid } from '../lib/bills';

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function BillsEditor({ data, onChange }: { data: AppData; onChange: (d: AppData) => void }) {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<BillFrequency>('monthly');
  const [dueDay, setDueDay] = useState('1');
  const [dueDate, setDueDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const upcoming = useMemo(() => {
    return data.bills
      .map((b) => {
        const d = billNextDueDate(b);
        if (!d) return null;
        return { bill: b, due: d, paid: isBillPaid(b, d) };
      })
      .filter(Boolean)
      .sort((a, b) => (a!.due.getTime() - b!.due.getTime()));
  }, [data.bills]);

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
    const due = billNextDueDate(b);
    if (!due) return;
    const nextBills = data.bills.map((x) => {
      if (x.id !== b.id) return x;
      if (x.frequency === 'once') return { ...x, paid: !x.paid };
      const ym = format(due, 'yyyy-MM');
      return { ...x, lastPaidYm: x.lastPaidYm === ym ? undefined : ym };
    });
    onChange({ ...data, bills: nextBills });
  };

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

        <div className="mt-4 flex flex-col gap-2">
          {upcoming.map((row) => {
            const r = row!;
            return (
              <div key={r.bill.id} className="flex items-center justify-between gap-2">
                <button onClick={() => togglePaid(r.bill)} className="flex-1 text-left">
                  <div className="font-semibold text-sm">{r.bill.title}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Next: {format(r.due, 'MMM d')} · ${r.bill.amountUsd.toFixed(0)}
                  </div>
                </button>
                <button
                  onClick={() => togglePaid(r.bill)}
                  className={
                    'px-3 py-2 rounded-2xl text-xs font-semibold ' +
                    (r.paid ? 'bg-black/5 dark:bg-white/10 text-gray-500' : 'bg-coral-500/15 text-coral-700 dark:text-coral-200')
                  }
                >
                  {r.paid ? 'Paid' : 'Unpaid'}
                </button>
                <button onClick={() => removeBill(r.bill.id)} className="px-3 py-2 rounded-2xl bg-black/5 dark:bg-white/10 text-xs">
                  ✕
                </button>
              </div>
            );
          })}
          {upcoming.length === 0 && <div className="text-sm text-gray-500 dark:text-gray-400">No bills yet.</div>}
        </div>
      </Card>
    </div>
  );
}
