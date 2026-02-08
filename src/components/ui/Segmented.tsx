interface SegmentedProps<T extends string> {
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (v: T) => void;
}

export function Segmented<T extends string>({ value, options, onChange }: SegmentedProps<T>) {
  return (
    <div className="inline-flex rounded-2xl bg-black/5 dark:bg-white/10 p-1">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={
              'px-3 py-1.5 text-sm rounded-xl transition ' +
              (active
                ? 'bg-white dark:bg-[#2c2c2e] shadow-sm text-gray-900 dark:text-gray-100'
                : 'text-gray-600 dark:text-gray-300')
            }
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
