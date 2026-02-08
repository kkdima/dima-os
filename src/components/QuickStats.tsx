import { useState, useEffect } from 'react';

export function QuickStats() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <div className="grid grid-cols-3 gap-3 px-4 py-4">
      <StatCard
        label="Date"
        value={formatDate(time)}
        icon="📅"
      />
      <StatCard
        label="Time"
        value={formatTime(time)}
        icon="⏰"
      />
      <StatCard
        label="Weather"
        value="--°"
        icon="🌤"
        sublabel="SF"
      />
      <div className="col-span-3">
        <div className="bg-white dark:bg-[#2c2c2e] rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">🚦</span>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Trading Guardrails</span>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Day P&L</p>
              <p className="text-lg font-semibold text-green-600 dark:text-green-400">--</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Max Loss</p>
              <p className="text-lg font-semibold">$500</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
              <p className="text-lg font-semibold text-green-600 dark:text-green-400">OK</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  icon: string;
  sublabel?: string;
}

function StatCard({ label, value, icon, sublabel }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-[#2c2c2e] rounded-2xl p-3 shadow-sm">
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-base">{icon}</span>
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</span>
      </div>
      <p className="text-base font-semibold">{value}</p>
      {sublabel && <p className="text-xs text-gray-500 dark:text-gray-400">{sublabel}</p>}
    </div>
  );
}
