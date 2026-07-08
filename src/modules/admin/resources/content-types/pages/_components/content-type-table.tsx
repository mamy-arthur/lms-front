'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { MoreHorizontal, Eye, Pencil, Layers } from 'lucide-react';
import type { ContentType, ModuleType } from '../../types';

// ─── Module badge colours ─────────────────────────────────────────────────────

const MODULE_BADGE_COLORS: Record<ModuleType, string> = {
  page: 'bg-blue-100 text-blue-700',
  file: 'bg-green-100 text-green-700',
  folder: 'bg-yellow-100 text-yellow-700',
  url: 'bg-purple-100 text-purple-700',
  media: 'bg-red-100 text-red-700',
  scorm: 'bg-orange-100 text-orange-700',
};

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 rounded-full bg-muted p-4">
        <Layers className="size-8 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium">Aucun Content Type</p>
      <p className="mt-1 text-xs text-muted-foreground max-w-xs">
        Créez votre premier Content Type en cliquant sur « Nouveau Content Type ».
      </p>
    </div>
  );
}

// ─── Skeleton row ─────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell>
        <Skeleton className="h-5 w-20 rounded-md" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-3 w-40" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-3 w-56" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-3 w-8" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-5 w-16 rounded-full" />
      </TableCell>
      <TableCell />
    </TableRow>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status?: string }) {
  if (status === 'draft') {
    return <Badge variant="secondary">Brouillon</Badge>;
  }
  return <Badge variant="default">Actif</Badge>;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface ContentTypeTableProps {
  contentTypes: ContentType[];
  isLoading?: boolean;
  onView: (ct: ContentType) => void;
  onEdit: (ct: ContentType) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ContentTypeTable({
  contentTypes,
  isLoading = false,
  onView,
  onEdit,
}: ContentTypeTableProps) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Module</TableHead>
            <TableHead>Titre</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Champs</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
          ) : contentTypes.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={6} className="p-0">
                <EmptyState />
              </TableCell>
            </TableRow>
          ) : (
            contentTypes.map((ct) => (
              <TableRow key={ct.id}>
                {/* Module */}
                <TableCell>
                  <span
                    className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold ${MODULE_BADGE_COLORS[ct.module_type] ?? 'bg-muted text-muted-foreground'}`}
                  >
                    {ct.module_type}
                  </span>
                </TableCell>

                {/* Title */}
                <TableCell className="font-medium">{ct.title}</TableCell>

                {/* Description */}
                <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                  {ct.description ?? '—'}
                </TableCell>

                {/* Field count */}
                <TableCell className="text-sm tabular-nums">
                  {ct.fields.filter((f) => !f.is_archived).length}
                </TableCell>

                {/* Status */}
                <TableCell>
                  <StatusBadge status={ct.status} />
                </TableCell>

                {/* Actions */}
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label="Actions">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onView(ct)}>
                        <Eye className="size-4 mr-2" />
                        Voir
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(ct)}>
                        <Pencil className="size-4 mr-2" />
                        Modifier
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
