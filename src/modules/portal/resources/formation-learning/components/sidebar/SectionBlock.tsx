import type { CourseSection } from '../../lib/types';
import ContentRow from './ContentRow';

interface Props {
  section: CourseSection;
  activeId: string;
  onSelect: (id: string) => void;
}

export default function SectionBlock({ section, activeId, onSelect }: Props) {
  return (
    <div>
      <div className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-sm">
        <span className="flex-1 truncate text-[12px]">{section.title}</span>
      </div>

      <div>
        {section.contents.map((ct) => (
          <ContentRow
            key={ct.id}
            content={ct}
            active={ct.id === activeId}
            onSelect={() => onSelect(ct.id)}
          />
        ))}
      </div>
    </div>
  );
}
