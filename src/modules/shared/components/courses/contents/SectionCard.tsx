'use client';

import { useState } from 'react';
import { MoreVertical, Plus, Pencil, Trash2, ChevronRight, X, BookOpen } from 'lucide-react';

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

import type { ApiCourseSection, ApiContentEntry } from '../hooks/useCourseContentApi';
import type { ContentTypeResource } from '@/shared/types/content-type.types';
import {
  useUpdateSection,
  useRemoveSection,
  useEntries,
  useRemoveEntry,
} from '../hooks/useCourseContentApi';
import { AddContentModal } from './AddContentModal';

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
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="rounded-xl border bg-card">
      <div className="flex items-center justify-between p-3">
        <CollapsibleTrigger asChild>
          <button className="flex min-w-0 flex-1 items-center gap-2 text-left">
            <ChevronRight className={`size-4 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
            <span className="truncate text-xs font-semibold">{section.name}</span>
          </button>
        </CollapsibleTrigger>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setEditOpen(true)}>
              <Pencil className="mr-2 size-4" />
              Modifier
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDeleteSection} className="text-destructive">
              <Trash2 className="mr-2 size-4" />
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <CollapsibleContent>
        <div className="space-y-1 px-2 pb-2">
          {/* Saved entries */}
          {entries.map((entry) => {
            const isSelected = selectedEntryId === entry.id;
            const label =
              typeof entry.data?.title === 'string'
                ? entry.data.title
                : `Contenu ${entry.content_type_id.slice(0, 6)}`;

            return (
              <div
                key={entry.id}
                onClick={() => onSelectEntry(entry)}
                className={`group flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors
    ${isSelected ? 'bg-(--color-primary)/90 text-white' : 'hover:bg-muted'}`}
              >
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <BookOpen className="size-4 shrink-0" />
                  <span className="truncate text-xs">{label || 'Nouveau contenu'}</span>
                </div>

                <button
                  onClick={async (e) => {
                    e.stopPropagation(); // Empêche de sélectionner lors de la suppression
                    try {
                      await removeEntry.mutateAsync(entry.id);
                      onEntryDeleted?.(entry.id);
                    } catch {
                      toast.error('Erreur lors de la suppression');
                    }
                  }}
                  className={`shrink-0 cursor-pointer rounded p-0.5 opacity-0 transition-opacity group-hover:opacity-100
      ${
        isSelected
          ? 'hover:bg-destructive/70 text-white'
          : 'hover:bg-destructive/10 text-destructive'
      }`}
                >
                  <Trash2 className="size-3" />
                </button>
              </div>
            );
          })}

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
  );
}
