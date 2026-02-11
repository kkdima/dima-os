export type CardVariant = 'default' | 'interactive' | 'hero';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: CardVariant;
}

const variantStyles: Record<CardVariant, string> = {
  default:
    'rounded-3xl bg-white/90 dark:bg-[#2c2c2e]/90 border border-black/5 dark:border-white/10 shadow-[0_8px_20px_rgba(0,0,0,0.06)]',
  interactive:
    'rounded-3xl bg-white/90 dark:bg-[#2c2c2e]/90 border border-black/5 dark:border-white/10 shadow-[0_8px_20px_rgba(0,0,0,0.06)] cursor-pointer transition-all duration-200 hover:shadow-[0_12px_28px_rgba(0,0,0,0.1)] active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-coral-500/50',
  hero: 'rounded-3xl bg-white/90 dark:bg-[#2c2c2e]/90 border border-black/10 dark:border-white/15 shadow-[0_12px_32px_rgba(0,0,0,0.08)]',
};

export function Card({ children, className = '', variant = 'default' }: CardProps) {
  return <div className={`${variantStyles[variant]} ${className}`}>{children}</div>;
}
