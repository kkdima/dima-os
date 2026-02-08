import { useMemo, useRef, useState } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card } from '../components/ui/Card';
import { Segmented } from '../components/ui/Segmented';
import { upsertMetricToday } from '../lib/appData';
import type { AppData } from '../lib/appData';
import { downloadText, readFileText } from '../lib/storage';
import { BillsEditor } from '../components/BillsEditor';

type Range = 'day' | 'week' | 'month';

function fmt(n?: number, digits = 1) {
  if (n === undefined) return '--';
  return n.toFixed(digits);
}

export function StatsPage({ data, onChange }: { data: AppData; onChange: (next: AppData) => void }) {
  const [range, setRange] = useState<Range>('week');
  const [weight, setWeight] = useState('');
  const [sleep, setSleep] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const rows = useMemo(() => {
    const all = data.metrics;
    if (range === 'day') return all.slice(-1);
    if (range === 'week') return all.slice(-7);
    return all.slice(-30);
  }, [data.metrics, range]);

  const today = data.metrics.at(-1);

  const exportData = () => {
    const text = JSON.stringify(data, null, 2);
    downloadText(`dima-os-backup-${new Date().toISOString().slice(0, 10)}.json`, text);
  };

  const importData = async (file: File) => {
    const text = await readFileText(file);
    const parsed = JSON.parse(text) as AppData;
    onChange(parsed);
  };

  const saveToday = () => {
    const entry = {
      date: '',
      weightKg: weight ? Number(weight) : undefined,
      sleepHours: sleep ? Number(sleep) : undefined,
    };
    onChange(upsertMetricToday(data, entry));
    setWeight('');
    setSleep('');
  };

  return (
    <div className="px-4 pt-3 pb-28 max-w-xl mx-auto">
      <div className="flex items-end justify-between gap-3">
        <h2 className="text-3xl font-semibold tracking-tight">Body Statistics</h2>
        <Segmented
          value={range}
          onChange={setRange}
          options={[
            { value: 'day', label: 'Day' },
            { value: 'week', label: 'Week' },
            { value: 'month', label: 'Month' },
          ]}
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Card className="p-4">
          <div className="text-sm font-medium text-gray-600 dark:text-gray-300">Weight</div>
          <div className="mt-1 text-3xl font-semibold">{fmt(today?.weightKg)} <span className="text-base text-gray-500">kg</span></div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-medium text-gray-600 dark:text-gray-300">Sleep</div>
          <div className="mt-1 text-3xl font-semibold">{fmt(today?.sleepHours)} <span className="text-base text-gray-500">h</span></div>
        </Card>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-300">Weight trend</div>
            <div className="text-xs text-gray-500">{range}</div>
          </div>
          <div className="mt-3 h-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={rows} margin={{ left: -8, right: 8, top: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="w" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ff5a4a" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#ff5a4a" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} hide />
                <YAxis tick={{ fontSize: 10 }} hide domain={['dataMin - 1', 'dataMax + 1']} />
                <Tooltip />
                <Area type="monotone" dataKey="weightKg" stroke="#ff5a4a" fill="url(#w)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-300">Sleep trend</div>
            <div className="text-xs text-gray-500">{range}</div>
          </div>
          <div className="mt-3 h-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={rows} margin={{ left: -8, right: 8, top: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="s" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ff5a4a" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#ff5a4a" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} hide />
                <YAxis tick={{ fontSize: 10 }} hide domain={[0, 10]} />
                <Tooltip />
                <Area type="monotone" dataKey="sleepHours" stroke="#ff5a4a" fill="url(#s)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="mt-3">
        <Card className="p-4">
          <div className="text-sm font-medium text-gray-600 dark:text-gray-300">Quick add (today)</div>
          <div className="mt-3 grid grid-cols-2 gap-2">
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
          </div>
          <button onClick={saveToday} className="mt-3 w-full rounded-2xl bg-coral-500 text-white py-2 font-semibold">
            Save
          </button>
        </Card>
      </div>

      <BillsEditor data={data} onChange={onChange} />

      <div className="mt-3">
        <Card className="p-4">
          <div className="text-sm font-medium text-gray-600 dark:text-gray-300">Backup (local data)</div>
          <div className="mt-3 flex gap-2">
            <button onClick={exportData} className="flex-1 rounded-2xl bg-black/5 dark:bg-white/10 py-2 font-semibold">
              Export JSON
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              className="flex-1 rounded-2xl bg-black/5 dark:bg-white/10 py-2 font-semibold"
            >
              Import JSON
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) importData(f);
              }}
            />
          </div>
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">All data stays on your device (localStorage).</div>
        </Card>
      </div>
    </div>
  );
}
