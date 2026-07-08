'use client';

import { Button } from '@/components/ui/button';
import { Trash2, Archive, ArchiveRestore } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface FieldActionsProps {
  isNew: boolean;
  isArchived: boolean;
  onRemove: () => void;
  onToggleArchive: () => void;
}

export function FieldActions({ isNew, isArchived, onRemove, onToggleArchive }: FieldActionsProps) {
  if (isNew) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={onRemove}
          >
            <Trash2 className="size-4" />
            <span className="sr-only">Supprimer le champ</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>Supprimer</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={
            isArchived
              ? 'text-muted-foreground hover:text-foreground'
              : 'text-amber-500 hover:text-amber-600 hover:bg-amber-50'
          }
          onClick={onToggleArchive}
        >
          {isArchived ? (
            <ArchiveRestore className="size-4" />
          ) : (
            <Archive className="size-4" />
          )}
          <span className="sr-only">{isArchived ? 'Désarchiver' : 'Archiver'}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>{isArchived ? 'Désarchiver' : 'Archiver'}</TooltipContent>
    </Tooltip>
  );
}
