import { cn } from '@/lib/utils';
import type { CourseContent } from '../../lib/types';
import StatusIcon from './StatusIcon';

interface Props {
  content: CourseContent;
  active: boolean;
  onSelect: () => void;
}

export default function ContentRow({ content, active, onSelect }: Props) {
  const isLocked = content.status === 'locked';
  return (
    <button
      type="button"
      onClick={isLocked ? undefined : onSelect}
      disabled={isLocked}
      className={cn(
        'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] transition-colors',
        active ? '' : ' hover:text-slate-800 hover:bg-slate-50',
        isLocked && 'cursor-not-allowed opacity-40',
      )}
      style={
        active
          ? {
              color: 'var(--color-primary)',
              background: 'color-mix(in srgb, var(--color-primary) 8%, transparent)',
            }
          : undefined
      }
    >
      <StatusIcon status={content.status} />
      <span className="flex-1 truncate">{content.title}</span>
    </button>
  );
}
