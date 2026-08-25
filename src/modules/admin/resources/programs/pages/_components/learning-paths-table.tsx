'use client';

import { MoreHorizontal, Pencil, Plus, Settings2, MapIcon, ChevronDown, X } from 'lucide-react';
import { memo, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { DataTable, type DataTableColumn, type DataTableSort } from '@/shared/components/ui/DataTable';
import { ModuleSearch } from '@modules/shared/components/modules';
import { formatDate } from '@/shared/lib/date';
import { formatDuration } from '../../lib/duration';
import type { LearningPath, LearningPathCategory } from '../../types';

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

type Props = {
  learningPaths: LearningPath[];
  categories: LearningPathCategory[];
  isLoading: boolean;
  hasQuery: boolean;
  page: number;
  pageSize: number;
  total: number;
  sort: DataTableSort;
  draftSearch: string;
  onDraftSearchChange: (v: string) => void;
  onSearch: () => void;
  selectedCategories: string[];
  onCategoryChange: (value: string) => void;
  onSort: (column: string) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onNew?: () => void;
  onEdit?: (path: LearningPath) => void;
  onDelete?: (id: string) => void;
  onManageCategories?: () => void;
};

function LearningPathsTableBase({
  learningPaths,
  categories,
  isLoading,
  hasQuery,
  page,
  pageSize,
  total,
  sort,
  draftSearch,
  onDraftSearchChange,
  onSearch,
  selectedCategories,
  onCategoryChange,
  onSort,
  onPageChange,
  onPageSizeChange,
  onNew,
  onEdit,
  onDelete,
  onManageCategories,
}: Props) {
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
              <img src={row.image.url} alt={row.name} className="size-8 shrink-0 rounded object-cover" />
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
        key: 'category_name',
        label: 'Catégorie',
        sortable: true,
        render: (row) => (
          <span className="text-xs text-muted-foreground">
            {row.categoryName ?? '—'}
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
        key: 'validity',
        label: 'Validité',
        sortable: false,
        render: (row) => (
          <span className="text-xs text-muted-foreground tabular-nums">
            {formatDuration(row.validity)}
          </span>
        ),
        skeleton: <Skeleton className="h-4 w-20" />,
      },
      {
        key: 'isPublished',
        label: 'Statut',
        sortable: false,
        render: (row) => <StatusBadge isPublished={row.showInShop} />,
        skeleton: <Skeleton className="h-5 w-16 rounded-full" />,
      },
      {
        key: 'published_at',
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
    [ActionMenu],
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-3 flex-wrap">
        <ModuleSearch value={draftSearch} onChange={onDraftSearchChange} onSearch={onSearch} />
        <div className="flex gap-2 flex-wrap items-center">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-9 w-auto justify-between text-xs font-normal">
                {selectedCategories.length === 0
                  ? 'Toutes les catégories'
                  : `${selectedCategories.length} catégorie${selectedCategories.length > 1 ? 's' : ''}`}
                <ChevronDown className="ml-1 size-3.5 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-60 p-2" align="end">
              <div className="space-y-0.5">
                {categories.map((cat) => (
                  <label key={cat.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-muted text-xs">
                    <Checkbox
                      checked={selectedCategories.includes(cat.id)}
                      onCheckedChange={() => onCategoryChange(cat.id)}
                      className="mt-0.5 data-[state=checked]:bg-(--color-primary) data-[state=checked]:border-(--color-primary)"
                    />
                    {cat.name}
                  </label>
                ))}
              </div>
              {selectedCategories.length > 0 && (
                <button
                  className="mt-1.5 w-full rounded px-2 py-1 text-center text-xs text-muted-foreground hover:bg-muted"
                  onClick={() => onCategoryChange('all')}
                >
                  Effacer le filtre
                </button>
              )}
            </PopoverContent>
          </Popover>
          <Button variant="outline" onClick={onManageCategories} className="gap-1.5">
            <Settings2 />
            Gérer les catégories
          </Button>
          <Button onClick={onNew} className="gap-1.5 bg-(--color-primary) hover:bg-(--color-primary)/80">
            <Plus className="size-3.5" />
            Nouveau parcours
          </Button>
        </div>
      </div>

      {selectedCategories.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedCategories.map((id) => {
            const cat = categories.find((c) => c.id === id);
            return (
              <Badge key={id} variant="outline" className="h-6 gap-1 px-2 text-xs font-normal bg-(--color-primary) text-white">
                {cat?.name ?? id}
                <button
                  onClick={() => onCategoryChange(id)}
                  className="ml-0.5 rounded-sm opacity-60 hover:opacity-100"
                  aria-label="Retirer ce filtre"
                >
                  <X className="size-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}

      <DataTable
        data={learningPaths}
        columns={columns}
        isLoading={isLoading}
        hasQuery={hasQuery}
        onRowClick={onEdit}
        emptyState={{
          icon: <MapIcon className="size-6 text-muted-foreground" />,
          title: 'Aucun parcours trouvé',
          description: 'Créez votre premier parcours en cliquant sur « Nouveau parcours ».',
          filteredTitle: 'Aucun résultat',
          filteredDescription: 'Aucun parcours ne correspond à votre recherche.',
        }}
        page={page}
        pageSize={pageSize}
        total={total}
        sort={sort}
        onSort={onSort}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </div>
  );
}

export const LearningPathsTable = memo(LearningPathsTableBase);
