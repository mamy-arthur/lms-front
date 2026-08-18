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
      <p className="px-2 pt-1.5 pb-2 text-xs">{section.title}</p>
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
