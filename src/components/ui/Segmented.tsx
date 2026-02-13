interface SegmentedProps<T extends string> {
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (v: T) => void;
}

export function Segmented<T extends string>({ value, options, onChange }: SegmentedProps<T>) {
  return (
    <div className="inline-flex rounded-2xl bg-color-bg-secondary p-1">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={
              'px-3 py-1.5 text-sm rounded-xl transition-colors duration-200 ' +
              (active
                ? 'bg-color-card shadow-sm text-color-text-primary'
                : 'text-color-text-secondary hover:text-color-text-primary')
            }
            aria-pressed={active}
            aria-label={`Select ${opt.label}`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
