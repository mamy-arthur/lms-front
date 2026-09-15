'use client';

import { BookOpen, GripVertical, Loader2, Trash2 } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import type { ApiContentEntry } from '@/shared/types/course.types';

interface Props {
  entry: ApiContentEntry;
  isSelected: boolean;
  /** True while this section's reorder request is in flight. */
  isReordering: boolean;
  onSelect: () => void;
  onDelete: () => void;
  isDeleting: boolean;
  /** Course frozen by a sale — deleting is refused, reordering and editing stay open. */
  locked?: boolean;
  lockReason?: string;
}

/**
 * One draggable content entry inside a SectionCard, mirroring how SectionCard
 * itself is made sortable within the course page: drag is bound to an explicit
 * grip so clicking the row still selects the entry.
 */
export function SortableEntryItem({
  entry,
  isSelected,
  isReordering,
  onSelect,
  onDelete,
  isDeleting,
  locked = false,
  lockReason = '',
}: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: entry.id,
  });

  const label =
    typeof entry.data?.title === 'string'
      ? entry.data.title
      : `Contenu ${entry.content_type_id.slice(0, 6)}`;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      onClick={onSelect}
      className={`group flex w-full cursor-pointer items-center gap-2 rounded-sm px-3 py-2 text-sm transition-colors
    ${isSelected ? 'bg-(--color-primary)/80 text-white' : 'hover:bg-muted'} ${isDragging ? 'opacity-50' : ''}`}
    >
      <button
        {...attributes}
        {...listeners}
        type="button"
        onClick={(e) => e.stopPropagation()}
        disabled={isReordering}
        className={`shrink-0 cursor-grab touch-none opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing disabled:cursor-wait
    ${isSelected ? 'text-white/70 hover:text-white' : 'text-muted-foreground/40 hover:text-muted-foreground'}`}
        aria-label={`Réordonner ${label || 'le contenu'}`}
      >
        <GripVertical className="size-3" />
      </button>

      <div className="flex min-w-0 flex-1 items-center gap-2">
        <BookOpen className="size-3 shrink-0" />
        <span className="truncate text-xs">{label || 'Nouveau contenu'}</span>
      </div>

      {/* Hidden rather than disabled: this button only appears on row hover, so a
          greyed-out one would read as a glitch more than as an explanation. The
          section menu carries the reason for the whole course. */}
      {locked ? (
        <span className="sr-only">{lockReason}</span>
      ) : (
        <button
          onClick={(e) => {
            e.stopPropagation(); // Empêche de sélectionner lors de la suppression
            onDelete();
          }}
          disabled={isDeleting}
          className={`shrink-0 cursor-pointer rounded p-0.5 opacity-0 transition-opacity group-hover:opacity-100
      ${
        isSelected
          ? 'hover:bg-destructive/70 text-white'
          : 'hover:bg-destructive/10 text-destructive'
      }`}
        >
          {isDeleting ? <Loader2 className="size-3 animate-spin" /> : <Trash2 className="size-3" />}
        </button>
      )}
    </div>
  );
}
