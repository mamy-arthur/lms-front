'use client';

import { MoreHorizontal, Pencil, Plus, Search, Settings2, MapIcon } from 'lucide-react';
import { memo, useCallback, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  // DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { DataTable, type DataTableColumn } from '@/shared/components/ui/DataTable';
import { formatDate } from '@/shared/lib/date';
import { formatDuration } from '../../lib/duration';
import type { LearningPath, LearningPathCategory } from '../../types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function PriceBadge({ path }: { path: LearningPath }) {
  if (path.price === null || path.price === undefined) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }
  if (path.price === 0) {
    return <span className="text-xs font-medium text-emerald-600">Gratuit</span>;
  }
  return (
    <span className="text-xs font-medium tabular-nums">
      {path.price.toLocaleString('fr-FR')} {path.currency ?? 'EUR'}
    </span>
  );
}

function StatusBadge({ isPublished }: { isPublished: boolean }) {
  if (isPublished) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
        Publié
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500 ring-1 ring-inset ring-gray-400/20">
      Brouillon
    </span>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = {
  learningPaths: LearningPath[];
  categories: LearningPathCategory[];
  isLoading: boolean;
  onNew?: () => void;
  onEdit?: (path: LearningPath) => void;
  onDelete?: (id: string) => void;
  onManageCategories?: () => void;
};

// ─── Component ────────────────────────────────────────────────────────────────

function LearningPathsTableBase({
  learningPaths,
  categories,
  isLoading,
  onNew,
  onEdit,
  onDelete,
  onManageCategories,
}: Props) {
  const [search, setSearch] = useState('');

  const categoryById = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c.name])),
    [categories],
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return learningPaths;
    return learningPaths.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
  }, [learningPaths, search]);

  const ActionMenu = useCallback(
    function ActionMenu({ item }: { item: LearningPath }) {
      return (
        <div className="text-right" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="size-8 text-muted-foreground hover:text-foreground data-[state=open]:bg-muted"
                aria-label={`Actions pour ${item.name}`}
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => onEdit?.(item)}>
                <Pencil className="mr-2 size-3.5 text-muted-foreground" />
                Modifier
              </DropdownMenuItem>
              {/* <DropdownMenuSeparator /> */}
              {/* <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete?.(item.id)}
              >
                <Trash2 className="mr-2 size-3.5" />
                Supprimer
              </DropdownMenuItem> */}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
    [onEdit, onDelete],
  );

  const columns: DataTableColumn<LearningPath>[] = useMemo(
    () => [
      {
        key: 'name',
        label: 'Nom du parcours',
        sortable: true,
        render: (row) => (
          <div className="flex items-center gap-3">
            {row.image ? (
              <img
                src={row.image.url}
                alt={row.name}
                className="size-8 shrink-0 rounded object-cover"
              />
            ) : (
              <div className="size-8 shrink-0 rounded bg-muted" />
            )}
            <span className="text-xs font-medium">{row.name}</span>
          </div>
        ),
        skeleton: (
          <div className="flex items-center gap-3">
            <Skeleton className="size-8 rounded" />
            <Skeleton className="h-4 w-40" />
          </div>
        ),
      },
      {
        key: 'category',
        label: 'Catégorie',
        sortable: true,
        render: (row) => (
          <span className="text-xs text-muted-foreground">
            {row.categoryId ? (categoryById[row.categoryId] ?? '—') : '—'}
          </span>
        ),
        skeleton: <Skeleton className="h-4 w-24" />,
      },
      {
        key: 'price',
        label: 'Prix',
        sortable: false,
        render: (row) => <PriceBadge path={row} />,
        skeleton: <Skeleton className="h-4 w-20" />,
      },
      {
        key: 'duration',
        label: 'Durée',
        sortable: true,
        render: (row) => (
          <span className="text-xs text-muted-foreground tabular-nums">
            {formatDuration(row.duration)}
          </span>
        ),
        skeleton: <Skeleton className="h-4 w-20" />,
      },
      {
        key: 'isPublished',
        label: 'Statut',
        sortable: true,
        render: (row) => <StatusBadge isPublished={row.showInShop} />,
        skeleton: <Skeleton className="h-5 w-16 rounded-full" />,
      },
      {
        key: 'publishedAt',
        label: 'Date de publication',
        sortable: true,
        render: (row) => (
          <span className="text-xs text-muted-foreground tabular-nums">
            {row.publishedAt ? formatDate(row.publishedAt) : '—'}
          </span>
        ),
        skeleton: <Skeleton className="h-4 w-28" />,
      },
      {
        key: 'actions',
        label: '',
        sortable: false,
        render: (row) => <ActionMenu item={row} />,
      },
    ],
    [ActionMenu, categoryById],
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher un parcours..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-8 text-sm"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onManageCategories} className="gap-1.5">
            <Settings2 />
            Gérer les catégories
          </Button>
          <Button
            onClick={onNew}
            className="gap-1.5 bg-(--color-primary) hover:bg-(--color-primary)/80"
          >
            <Plus className="size-3.5" />
            Nouveau parcours
          </Button>
        </div>
      </div>
      <DataTable
        data={filtered}
        columns={columns}
        isLoading={isLoading}
        hasQuery={search.trim().length > 0}
        emptyState={{
          icon: <MapIcon className="size-6 text-muted-foreground" />,
          title: 'Aucun parcours trouvé',
          description: 'Créez votre premier parcours en cliquant sur « Nouveau parcours ».',
          filteredTitle: 'Aucun résultat',
          filteredDescription: 'Aucun parcours ne correspond à votre recherche.',
        }}
        page={1}
        pageSize={25}
        total={filtered.length}
        onPageChange={() => {}}
        onPageSizeChange={() => {}}
        hidePaginationWhenSinglePage
      />
    </div>
  );
}

export const LearningPathsTable = memo(LearningPathsTableBase);
