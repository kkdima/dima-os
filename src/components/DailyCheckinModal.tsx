import { useEffect, useMemo, useState } from 'react';
import { BottomSheet } from './ui/BottomSheet';
import type { AppData, DailyCheckin } from '../lib/appData';
import { getTodayCheckin, upsertCheckinToday, upsertMetricToday } from '../lib/appData';
import { isoDate } from '../lib/dates';

interface DailyCheckinModalProps {
  open: boolean;
  onClose: () => void;
  data: AppData;
  onChange: (next: AppData) => void;
}

export function DailyCheckinModal({ open, onClose, data, onChange }: DailyCheckinModalProps) {
  const existing = useMemo(() => getTodayCheckin(data), [data]);

  const [weight, setWeight] = useState('');
  const [sleep, setSleep] = useState('');
  const [calories, setCalories] = useState('');
  const [trainingMin, setTrainingMin] = useState('');
  const [smoked, setSmoked] = useState<boolean>(false);
  const [tradesCount, setTradesCount] = useState('0');
  const [tradeLogDone, setTradeLogDone] = useState<boolean>(false);

  useEffect(() => {
    if (!open) return;

    const lastMetric = data.metrics.at(-1);
    setWeight(lastMetric?.weightKg !== undefined ? String(lastMetric.weightKg) : '');
    setSleep(lastMetric?.sleepHours !== undefined ? String(lastMetric.sleepHours) : '');

    const c = existing;
    setCalories(c?.caloriesKcal !== undefined ? String(c.caloriesKcal) : '');
    setTrainingMin(c?.trainingMin !== undefined ? String(c.trainingMin) : '');
    setSmoked(!!c?.smoked);
    setTradesCount(c?.tradesCount !== undefined ? String(c.tradesCount) : '0');
    setTradeLogDone(!!c?.tradeLogDone);
  }, [open]);

  const save = () => {
    let next = data;
    const today = new Date();
    const todayKey = isoDate(today);

    // metrics - checkin modal is authoritative, always overwrite
    const w = weight.trim() ? Number(weight) : undefined;
    const s = sleep.trim() ? Number(sleep) : undefined;
    if (w !== undefined || s !== undefined) {
      next = upsertMetricToday(next, { date: '', weightKg: w, sleepHours: s });
    }

    // checkin
    const cal = calories.trim() ? Number(calories) : undefined;
    const train = trainingMin.trim() ? Number(trainingMin) : undefined;
    const trades = tradesCount.trim() ? Number(tradesCount) : undefined;
    const entry: Omit<DailyCheckin, 'date'> = {
      caloriesKcal: cal,
      trainingMin: train,
      smoked,
      tradesCount: trades,
      tradeLogDone,
    };
    next = upsertCheckinToday(next, entry);

    // Autopopulate habits based on checkin data - set true/false based on condition
    next = structuredClone(next);

    // Habit: 3100 kcal - mark done if calories >= 3100
    if (!next.habitCompletions['kcal_3100']) next.habitCompletions['kcal_3100'] = {};
    next.habitCompletions['kcal_3100'][todayKey] = cal !== undefined && cal >= 3100;

    // Habit: Training - mark done if training > 0
    if (!next.habitCompletions['training']) next.habitCompletions['training'] = {};
    next.habitCompletions['training'][todayKey] = train !== undefined && train > 0;

    // Habit: No smoking - mark done if NOT smoked
    if (!next.habitCompletions['no_smoking']) next.habitCompletions['no_smoking'] = {};
    next.habitCompletions['no_smoking'][todayKey] = !smoked;

    // Habit: ≤ 2 trades - mark done if trades <= 2
    if (!next.habitCompletions['max_2_trades']) next.habitCompletions['max_2_trades'] = {};
    next.habitCompletions['max_2_trades'][todayKey] = trades !== undefined && trades <= 2;

    // Habit: Trade log done - mark done if tradeLogDone is true
    if (!next.habitCompletions['trade_log']) next.habitCompletions['trade_log'] = {};
    next.habitCompletions['trade_log'][todayKey] = !!tradeLogDone;

    onChange(next);
    onClose();
  };

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Daily check-in"
      description="30 seconds. Save and done."
      footer={
        <button
          onClick={save}
          className="w-full rounded-2xl bg-coral-500 text-white py-2 font-semibold"
        >
          Save
        </button>
      }
    >
      <div className="grid grid-cols-2 gap-2">
        <input
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          inputMode="decimal"
          placeholder="Weight (kg)"
          className="w-full rounded-2xl bg-black/5 dark:bg-white/10 px-3 py-2 outline-none"
        />
        <input
          value={sleep}
          onChange={(e) => setSleep(e.target.value)}
          inputMode="decimal"
          placeholder="Sleep (h)"
          className="w-full rounded-2xl bg-black/5 dark:bg-white/10 px-3 py-2 outline-none"
        />
        <input
          value={calories}
          onChange={(e) => setCalories(e.target.value)}
          inputMode="numeric"
          placeholder="Calories (kcal)"
          className="w-full rounded-2xl bg-black/5 dark:bg-white/10 px-3 py-2 outline-none"
        />
        <input
          value={trainingMin}
          onChange={(e) => setTrainingMin(e.target.value)}
          inputMode="numeric"
          placeholder="Training (min)"
          className="w-full rounded-2xl bg-black/5 dark:bg-white/10 px-3 py-2 outline-none"
        />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <label className="flex items-center justify-between rounded-2xl bg-black/5 dark:bg-white/10 px-3 py-2">
          <span className="text-sm font-semibold">Smoked today</span>
          <input type="checkbox" checked={smoked} onChange={(e) => setSmoked(e.target.checked)} />
        </label>
        <label className="flex items-center justify-between rounded-2xl bg-black/5 dark:bg-white/10 px-3 py-2">
          <span className="text-sm font-semibold">Trade log done</span>
          <input type="checkbox" checked={tradeLogDone} onChange={(e) => setTradeLogDone(e.target.checked)} />
        </label>
        <input
          value={tradesCount}
          onChange={(e) => setTradesCount(e.target.value)}
          inputMode="numeric"
          placeholder="Trades count"
          className="col-span-2 w-full rounded-2xl bg-black/5 dark:bg-white/10 px-3 py-2 outline-none"
        />
      </div>
    </BottomSheet>
  );
}
