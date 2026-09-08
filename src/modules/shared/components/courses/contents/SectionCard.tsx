'use client';

import { useState } from 'react';
import {
  MoreVertical,
  Plus,
  Pencil,
  Trash2,
  ChevronRight,
  X,
  BookOpen,
  GripVertical,
  Loader2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import type { ApiCourseSection, ApiContentEntry } from '../hooks/useCourseContentApi';
import type { ContentTypeResource } from '@/shared/types/content-type.types';
import {
  useUpdateSection,
  useRemoveSection,
  useEntries,
  useRemoveEntry,
  useMoveEntry,
} from '../hooks/useCourseContentApi';
import { AddContentModal } from './AddContentModal';
import { SortableEntryItem } from './SortableEntryItem';

/** A pending (unsaved) entry shown locally before the user clicks "Enregistrer". */
export interface PendingEntryInfo {
  moduleType: string;
  title: string;
}

interface Props {
  courseId: string;
  section: ApiCourseSection;
  /** ID of the currently selected saved entry, if any. */
  selectedEntryId?: string;
  onSelectEntry: (entry: ApiContentEntry) => void;
  onEntryDeleted?: (entryId: string) => void;
  /** Pending (unsaved) entry belonging to this section — shown in local state only. */
  pendingEntry?: PendingEntryInfo;
  /** Whether the pending entry is currently selected in the right panel. */
  pendingEntrySelected?: boolean;
  /** Called when the user clicks the pending entry item to re-select it. */
  onPendingEntrySelect?: () => void;
  /** Called when the user discards the pending entry (X button). */
  onPendingEntryCancel?: () => void;
  /** Called when the user picks a ContentType from the modal — NO API call yet. */
  onContentTypeSelected?: (ct: ContentTypeResource) => void;
}

export function SectionCard({
  courseId,
  section,
  selectedEntryId,
  onSelectEntry,
  onEntryDeleted,
  pendingEntry,
  pendingEntrySelected = false,
  onPendingEntrySelect,
  onPendingEntryCancel,
  onContentTypeSelected,
}: Props) {
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const [title, setTitle] = useState(section.name);

  const updateSection = useUpdateSection(courseId);
  const removeSection = useRemoveSection(courseId);
  const { data: entries = [] } = useEntries(section.id);
  const removeEntry = useRemoveEntry(section.id);
  const moveEntry = useMoveEntry(section.id);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
  });

  // The API returns entries in rank order, but an optimistic reorder rewrites ranks
  // locally — sorting here keeps the list authoritative in both cases.
  const sortedEntries = entries.slice().sort((a, b) => a.rank - b.rank);

  // Own sensors: this list is nested inside the course page's section DndContext,
  // and each context needs its own. Same activation distance so a click on a row
  // still selects the entry instead of starting a drag.
  const entrySensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleEntryDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sortedEntries.findIndex((e) => e.id === active.id);
    const newIndex = sortedEntries.findIndex((e) => e.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const orderedIds = arrayMove(sortedEntries, oldIndex, newIndex).map((e) => e.id);

    try {
      // The hook applies the new order immediately and rolls it back on failure.
      await moveEntry.mutateAsync({
        entryId: String(active.id),
        orderedIds,
        position: newIndex,
      });
    } catch {
      toast.error('Erreur lors du réordonnancement du contenu');
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    try {
      await removeEntry.mutateAsync(entryId);
      onEntryDeleted?.(entryId);
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  const save = async () => {
    try {
      await updateSection.mutateAsync({
        sectionId: section.id,
        name: title.trim() || section.name,
      });
      setEditOpen(false);
    } catch {
      toast.error('Erreur lors de la mise à jour de la section');
    }
  };

  const handleDeleteSection = async () => {
    try {
      await removeSection.mutateAsync(section.id);
    } catch {
      toast.error('Erreur lors de la suppression de la section');
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={isDragging ? 'opacity-50' : undefined}
    >
      {/* `group/section` (nommé) et non `group` : les lignes d'entrées imbriquées
          utilisent le groupe anonyme pour leurs propres poignées — un groupe
          anonyme ici les déclencherait aussi au survol de la section. */}
      <Collapsible
        open={isOpen}
        onOpenChange={setIsOpen}
        className="group/section rounded-sm border bg-card"
      >
        <div className="flex items-center justify-between p-3">
          <button
            {...attributes}
            {...listeners}
            type="button"
            className={`mr-1 cursor-grab touch-none text-muted-foreground/40 transition-opacity hover:text-muted-foreground focus-visible:opacity-100 group-hover/section:opacity-100 active:cursor-grabbing ${
              isDragging ? 'opacity-100' : 'opacity-0'
            }`}
            aria-label="Réordonner la section"
          >
            <GripVertical className="size-4" />
          </button>
          <CollapsibleTrigger asChild>
            <button className="flex min-w-0 flex-1 items-center gap-2 text-left">
              <ChevronRight
                className={`size-4 transition-transform ${isOpen ? 'rotate-90' : ''}`}
              />
              <span className="truncate text-xs font-semibold">{section.name}</span>
            </button>
          </CollapsibleTrigger>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="size-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditOpen(true)}>
                <Pencil className="mr-2 size-4" />
                Modifier
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDeleteSection}
                disabled={removeSection.isPending}
                className="text-destructive"
              >
                {removeSection.isPending ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 size-4" />
                )}
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <CollapsibleContent>
          <div className="space-y-1 px-2 pb-2">
            {/* Saved entries — reorderable */}
            <DndContext
              sensors={entrySensors}
              collisionDetection={closestCenter}
              onDragEnd={handleEntryDragEnd}
            >
              <SortableContext
                items={sortedEntries.map((e) => e.id)}
                strategy={verticalListSortingStrategy}
              >
                {sortedEntries.map((entry) => (
                  <SortableEntryItem
                    key={entry.id}
                    entry={entry}
                    isSelected={selectedEntryId === entry.id}
                    isReordering={moveEntry.isPending}
                    onSelect={() => onSelectEntry(entry)}
                    onDelete={() => handleDeleteEntry(entry.id)}
                    isDeleting={removeEntry.isPending && removeEntry.variables === entry.id}
                  />
                ))}
              </SortableContext>
            </DndContext>

            {/* Pending (unsaved) entry — local state only */}
            {pendingEntry && (
              <div
                className={`group flex w-full items-center gap-2 rounded-lg border border-dashed px-3 py-2 text-sm transition-colors
                ${pendingEntrySelected ? 'border-primary/40 bg-(--color-primary)/90 text-white' : 'border-muted-foreground/30 hover:bg-muted'}`}
              >
                <button
                  onClick={onPendingEntrySelect}
                  className="flex min-w-0 flex-1 items-center gap-2"
                >
                  {(() => {
                    return <BookOpen className="size-4 shrink-0 opacity-60" />;
                  })()}
                  <span className="truncate text-xs italic">{pendingEntry.title}</span>
                  <span
                    className={`ml-1 shrink-0 text-[10px] ${pendingEntrySelected ? 'text-white/70' : 'text-muted-foreground'}`}
                  >
                    (brouillon)
                  </span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onPendingEntryCancel?.();
                  }}
                  className={`shrink-0 cursor-pointer rounded p-0.5 opacity-0 transition-opacity group-hover:opacity-100
                  ${pendingEntrySelected ? 'text-white hover:bg-white/20' : 'text-muted-foreground hover:bg-muted'}`}
                  aria-label="Annuler le contenu en cours"
                >
                  <X className="size-3" />
                </button>
              </div>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAddOpen(true)}
              className="mt-2 w-full justify-start"
            >
              <Plus className="mr-2 size-4" />
              Ajouter un contenu
            </Button>
          </div>

          <AddContentModal
            open={addOpen}
            onOpenChange={setAddOpen}
            onContentTypeSelected={(ct) => {
              setAddOpen(false);
              onContentTypeSelected?.(ct);
            }}
          />
        </CollapsibleContent>

        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Modifier la section</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Nom</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditOpen(false)}>
                Annuler
              </Button>
              <Button onClick={save} disabled={updateSection.isPending}>
                {updateSection.isPending ? 'Enregistrement…' : 'Enregistrer'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Collapsible>
    </div>
  );
}
