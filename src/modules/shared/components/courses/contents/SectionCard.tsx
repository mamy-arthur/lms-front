'use client';

import { useState } from 'react';
import {
  MoreVertical,
  Plus,
  Pencil,
  Trash2,
  FileText,
  File as FileIcon,
  Folder,
  Package,
  Link as LinkIcon,
  BarChart3,
  Type as TypeIcon,
  Image,
  Box,
  ChevronRight,
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AddContentModal } from './AddContentModal';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

import { CourseSection, CourseContent } from '../types';
import { useCourseStore } from '../hooks/useCouseContentStore';

const ICONS: Record<string, React.ElementType> = {
  page: FileText,
  file: FileIcon,
  folder: Folder,
  scorm: Package,
  url: LinkIcon,
  survey: BarChart3,
  'text-media': TypeIcon,
  media: Image,
};

interface Props {
  section: CourseSection;
  selectedContentId?: string;
  onSelectContent: (content: CourseContent) => void;
  onContentDeleted?: (contentId: string) => void;
}

export function SectionCard({ section, selectedContentId, onSelectContent, onContentDeleted }: Props) {
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(true);

  const [title, setTitle] = useState(section.title);
  const [description, setDescription] = useState(section.description ?? '');

  const updateSection = useCourseStore((s) => s.updateSection);
  const removeSection = useCourseStore((s) => s.removeSection);
  const removeContent = useCourseStore((s) => s.removeContent);

  const save = () => {
    updateSection(section.id, {
      title: title.trim() || 'Section',
      description,
    });

    setEditOpen(false);
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="rounded-xl border bg-card">
      <div className="flex items-center justify-between p-3">
        <CollapsibleTrigger asChild>
          <button className="flex min-w-0 flex-1 items-center gap-2 text-left">
            <ChevronRight className={`size-4 transition-transform ${isOpen ? 'rotate-90' : ''}`} />

            <span className="truncate text-xs font-semibold">{section.title}</span>
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

            <DropdownMenuItem
              onClick={() => removeSection(section.id)}
              className="text-destructive"
            >
              <Trash2 className="mr-2 size-4" />
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <CollapsibleContent>
        <div className="space-y-1 px-2 pb-2">
          {section.contents.map((content) => {
            const Icon = ICONS[content.type] ?? Box;
            const isSelected = selectedContentId === content.id;

            return (
              <div
                key={content.id}
                className={`group flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors
                  ${isSelected ? 'bg-(--color-primary)/90 text-white' : 'hover:bg-muted'}`}
              >
                <button
                  onClick={() => onSelectContent(content)}
                  className="flex min-w-0 flex-1 items-center gap-2"
                >
                  <Icon className="size-4 shrink-0" />
                  <span className="truncate text-xs">{content.title || 'Nouveau contenu'}</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeContent(section.id, content.id);
                    onContentDeleted?.(content.id);
                  }}
                  className={`shrink-00 cursor-pointer rounded p-0.5 opacity-0 transition-opacity group-hover:opacity-100
                    ${isSelected ? 'hover:bg-destructive/70 text-white' : 'hover:bg-destructive/10 text-destructive'}`}
                >
                  <Trash2 className="size-3" />
                </button>
              </div>
            );
          })}

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
          sectionId={section.id}
          onSelect={() => {}}
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

            <div>
              <Label>Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Annuler
            </Button>

            <Button onClick={save}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Collapsible>
  );
}
