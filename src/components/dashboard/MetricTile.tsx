import { Card } from '../ui/Card';
import { useMemo } from 'react';

export type MetricAccent = 'coral' | 'neutral' | 'amber' | 'green';

interface SparklineProps {
  values: number[];
  accent?: MetricAccent;
}

const accentColors: Record<MetricAccent, string> = {
  coral: 'text-coral-500',
  neutral: 'text-gray-500 dark:text-gray-400',
  amber: 'text-amber-500',
  green: 'text-emerald-500',
};

function Sparkline({ values, accent = 'coral' }: SparklineProps) {
  const points = useMemo(() => {
    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = max - min || 1;
    return values
      .map((v, i) => {
        const x = (i / (values.length - 1)) * 100;
        const y = 100 - ((v - min) / range) * 100;
        return `${x},${y}`;
      })
      .join(' ');
  }, [values]);

  return (
    <svg viewBox="0 0 100 100" className="w-full h-10">
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
        className={accentColors[accent]}
      />
    </svg>
  );
}

interface MetricTileProps {
  title: string;
  value: string;
  unit?: string;
  hint?: string;
  series?: number[];
  rightSlot?: React.ReactNode;
  accent?: MetricAccent;
  variant?: 'default' | 'hero';
}

export function MetricTile({
  title,
  value,
  unit,
  hint,
  series,
  rightSlot,
  accent = 'coral',
  variant = 'default',
}: MetricTileProps) {
  const cardVariant = variant === 'hero' ? 'hero' : 'default';

  return (
    <Card variant={cardVariant} className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium text-gray-600 dark:text-gray-300">{title}</div>
          <div className="mt-1 text-3xl font-semibold tracking-tight">
            {value}
            {unit && (
              <span className="text-base font-semibold text-gray-500 dark:text-gray-400"> {unit}</span>
            )}
          </div>
          {hint && <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">{hint}</div>}
        </div>
        {rightSlot ? (
          <div className="w-24">{rightSlot}</div>
        ) : series ? (
          <div className={`w-24 ${accentColors[accent]}`}>
            <Sparkline values={series} accent={accent} />
          </div>
        ) : null}
      </div>
    </Card>
  );
}
