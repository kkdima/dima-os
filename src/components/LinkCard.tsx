import type { Link } from '../data/links';

interface LinkCardProps {
  link: Link;
}

export function LinkCard({ link }: LinkCardProps) {
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 bg-white dark:bg-[#2c2c2e] rounded-2xl p-4 shadow-sm active:scale-[0.98] transition-transform"
    >
      <span className="text-2xl">{link.icon || '🔗'}</span>
      <span className="font-medium flex-1 truncate">{link.title}</span>
      <svg
        className="w-4 h-4 text-gray-400 flex-shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5l7 7-7 7"
        />
      </svg>
    </a>
  );
}
