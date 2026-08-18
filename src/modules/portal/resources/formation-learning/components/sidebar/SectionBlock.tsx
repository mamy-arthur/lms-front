import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CourseSection } from '../../lib/types';
import ContentRow from './ContentRow';

interface Props {
  section: CourseSection;
  activeId: string;
  onSelect: (id: string) => void;
}

export default function SectionBlock({ section, activeId, onSelect }: Props) {
  const defaultOpen = section.contents.some((c) => c.id === activeId);
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-xs text-slate-500 hover:bg-slate-50 transition-colors"
      >
        <ChevronRight
          className={cn(
            'h-3 w-3 shrink-0 text-slate-300 transition-transform',
            open && 'rotate-90',
          )}
        />
        <span className="flex-1 truncate">{section.title}</span>
      </button>

      {open && (
        <div className="ml-4">
          {section.contents.map((ct) => (
            <ContentRow
              key={ct.id}
              content={ct}
              active={ct.id === activeId}
              onSelect={() => onSelect(ct.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
