import type { PropsWithChildren } from 'react';

export function Card({ children, className = '' }: PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={
        'rounded-3xl bg-white/90 dark:bg-[#2c2c2e]/90 border border-black/5 dark:border-white/10 shadow-[0_8px_20px_rgba(0,0,0,0.06)] ' +
        className
      }
    >
      {children}
    </div>
  );
}
