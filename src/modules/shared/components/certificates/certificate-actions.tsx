'use client';

import { Eye, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface CertificateActionsProps {
  certificateLabel: string;
  onEdit?: () => void;
  onDelete?: () => void;
  onPreview?: () => void;
}

export function CertificateActions({
  certificateLabel,
  onEdit,
  onDelete,
  onPreview,
}: CertificateActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-muted-foreground hover:text-foreground data-[state=open]:bg-muted"
          aria-label={`Actions pour ${certificateLabel}`}
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={() => onPreview?.()}>
          <Eye className="mr-2 size-3.5 text-muted-foreground" />
          Aperçu
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onEdit?.()}>
          <Pencil className="mr-2 size-3.5 text-muted-foreground" />
          Modifier
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => onDelete?.()}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 size-3.5" />
          Supprimer
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
