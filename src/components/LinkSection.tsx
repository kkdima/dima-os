import type { Section } from '../data/links';
import { LinkCard } from './LinkCard';

interface LinkSectionProps {
  section: Section;
}

export function LinkSection({ section }: LinkSectionProps) {
  return (
    <section className="px-4">
      <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 px-1">
        {section.title}
      </h2>
      <div className="flex flex-col gap-2">
        {section.links.map((link) => (
          <LinkCard key={link.url} link={link} />
        ))}
      </div>
    </section>
  );
}
