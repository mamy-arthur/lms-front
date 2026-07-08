'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Eye,
  File as FileIcon,
  Folder,
  Layers,
  Link as LinkIcon,
  MoreHorizontal,
  Package,
  Pencil,
  FileText,
  ImagePlay,
} from 'lucide-react';
import type { ContentType, ModuleType } from '../../types';

// ─── Module meta ──────────────────────────────────────────────────────────────

const MODULE_META: Record<ModuleType, { label: string; bgColor: string; Icon: React.ElementType }> =
  {
    page: { label: 'Page', bgColor: 'bg-blue-400', Icon: FileText },
    file: { label: 'Fichier', bgColor: 'bg-yellow-500', Icon: FileIcon },
    folder: { label: 'Dossier', bgColor: 'bg-red-400', Icon: Folder },
    url: { label: 'URL', bgColor: 'bg-green-400', Icon: LinkIcon },
    media: { label: 'Média', bgColor: 'bg-pink-500', Icon: ImagePlay },
    scorm: { label: 'SCORM', bgColor: 'bg-orange-500', Icon: Package },
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

// ─── Skeleton card ────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border p-4">
      <Skeleton className="h-10 w-10 rounded-lg" />
      <div className="space-y-1.5">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
      </div>
      <div className="mt-auto flex items-center justify-between pt-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
    </div>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status?: string }) {
  if (status === 'draft') {
    return <Badge variant="secondary">Brouillon</Badge>;
  }
  return <Badge variant="default" className='bg-green-500'>Actif</Badge>;
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
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (contentTypes.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-4 lg:grid-cols-5">
      {contentTypes.map((ct) => {
        const meta = MODULE_META[ct.module_type];
        const activeFieldCount = ct.fields.filter((f) => !f.is_archived).length;
        return (
          <div
            key={ct.id}
            className="group flex flex-col gap-3 rounded-xl border border-border bg-card p-4 transition-all hover:border-muted-foreground/30 hover:shadow-sm"
          >
            {/* Icon + actions row */}
            <div className="flex items-start justify-between">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg text-white ${meta.bgColor}`}
              >
                <meta.Icon className="h-5 w-5" />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Actions"
                    className="opacity-0 transition-opacity group-hover:opacity-100"
                  >
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
            </div>

            {/* Content */}
            <div className="flex-1 space-y-1">
              <p className="text-xs font-semibold">{ct.title}</p>
              {ct.description && (
                <p className="line-clamp-2 text-xs text-muted-foreground">{ct.description}</p>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t pt-3">
              <span className="text-xs text-muted-foreground">
                {activeFieldCount} champ{activeFieldCount !== 1 ? 's' : ''}
              </span>
              <StatusBadge status={ct.status} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
