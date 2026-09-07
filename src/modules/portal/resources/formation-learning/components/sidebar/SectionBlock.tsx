import { cn } from '@/lib/utils';
import type { CourseSection } from '../../lib/types';
import ContentRow from './ContentRow';

interface Props {
  section: CourseSection;
  activeId: string;
  onSelect: (id: string) => void;
  /** Hidden when the course has a single unnamed grouping — avoids a useless label. */
  showLabel?: boolean;
}

/**
 * Niveau 3 — Section. A *grouping label*, never a destination.
 *
 * Rendered as small caps in a muted tone with no hover, no icon and no pointer
 * affordance, so it cannot be mistaken for something clickable: the previous
 * version looked like a slightly smaller content row, which is exactly why users
 * could not tell a section apart from the content inside it.
 */
export default function SectionBlock({ section, activeId, onSelect, showLabel = true }: Props) {
  const containsActive = section.contents.some((c) => c.id === activeId);

  return (
    <div className="pt-1.5 first:pt-0.5">
      {showLabel && (
        <div className="flex items-center gap-2 pb-1 pl-4 pr-2 pt-1">
          <span
            className={cn(
              'truncate text-[10.5px] font-semibold uppercase ',
              containsActive ? 'text-(--color-primary)/70' : 'text-slate-400',
            )}
          >
            {section.title}
          </span>
          <span className="h-px flex-1 bg-slate-200" />
        </div>
      )}

      {section.contents.map((ct) => (
        <ContentRow
          key={ct.id}
          content={ct}
          active={ct.id === activeId}
          onSelect={() => onSelect(ct.id)}
        />
      ))}
    </div>
  );
}
