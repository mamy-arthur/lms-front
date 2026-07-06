'use client';

import { MoreHorizontal, Pencil, Plus, Search, Settings2, Trash2 } from 'lucide-react';
import { memo, useCallback, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { DataTable, type DataTableColumn } from '@/shared/components/ui/DataTable';
import { formatDate } from '@/shared/lib/date';
import { StatusBadge } from './StatusBadge';
import type { StoredProgram } from '../types';

// ─── Category labels ──────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  tech: 'Technologie',
  business: 'Business',
  design: 'Design',
  marketing: 'Marketing',
};

// ─── Table ────────────────────────────────────────────────────────────────────

type Props = {
  programs: StoredProgram[];
  onNew?: () => void;
  onEdit?: (program: StoredProgram) => void;
  onDelete?: (id: string) => void;
};

function ProgramsTableBase({ programs, onNew, onEdit, onDelete }: Props) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return programs;
    return programs.filter((p) => p.formValues.name.toLowerCase().includes(search.toLowerCase()));
  }, [programs, search]);

  const ActionMenu = useCallback(
    function ActionMenu({ item }: { item: StoredProgram }) {
      return (
        <div className="text-right" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="size-8 text-muted-foreground hover:text-foreground data-[state=open]:bg-muted"
                aria-label={`Actions pour ${item.formValues.name}`}
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => onEdit?.(item)}>
                <Pencil className="mr-2 size-3.5 text-muted-foreground" />
                Modifier
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete?.(item.id)}
              >
                <Trash2 className="mr-2 size-3.5" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
    [onEdit, onDelete],
  );

  const columns: DataTableColumn<StoredProgram>[] = useMemo(
    () => [
      {
        key: 'name',
        label: 'Nom',
        sortable: true,
        render: (row) => <span className="text-xs font-medium">{row.formValues.name}</span>,
      },
      {
        key: 'category',
        label: 'Catégorie',
        sortable: true,
        render: (row) => (
          <span className="text-xs text-muted-foreground">
            {CATEGORY_LABELS[row.formValues.category] ?? row.formValues.category}
          </span>
        ),
      },
      {
        key: 'status',
        label: 'Statut',
        sortable: true,
        render: (row) => <StatusBadge status={row.status} />,
      },
      {
        key: 'deadline',
        label: "Date d'échéance",
        sortable: true,
        render: (row) => (
          <span className="text-xs text-muted-foreground tabular-nums">
            {row.formValues.deadline
              ? formatDate(row.formValues.deadline.toISOString().split('T')[0])
              : '—'}
          </span>
        ),
      },
      {
        key: 'cost',
        label: 'Tarification',
        sortable: true,
        render: (row) => {
          const cost = parseFloat(row.formValues.cost);
          if (isNaN(cost) || row.formValues.cost === '')
            return <span className="text-xs text-muted-foreground">—</span>;
          if (cost === 0)
            return <span className="text-xs font-medium text-emerald-600">Gratuit</span>;
          return (
            <span className="text-xs font-medium tabular-nums">
              {cost.toLocaleString('fr-FR')} {row.formValues.currency ?? 'EUR'}
            </span>
          );
        },
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher une formation..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2 sm:ml-auto">
          <Button variant="outline">
            <Settings2 className="size-4" />
            Filtrer
          </Button>
          <Button
            className="bg-(--color-primary) hover:bg-(--color-primary)/80 text-primary-foreground"
            onClick={onNew}
          >
            <Plus className="size-4" />
            Nouvelle formation
          </Button>
        </div>
      </div>

      <DataTable
        data={filtered}
        columns={columns}
        isLoading={false}
        hasQuery={!!search.trim()}
        page={1}
        pageSize={filtered.length || 1}
        total={filtered.length}
        onPageChange={() => {}}
        onPageSizeChange={() => {}}
        onRowClick={onEdit}
        emptyState={{
          title: 'Aucune formation',
          description: 'Aucune formation pour le moment.',
          filteredTitle: 'Aucun résultat',
          filteredDescription: 'Aucune formation ne correspond à votre recherche.',
        }}
      />
    </div>
  );
}

export const ProgramsTable = memo(ProgramsTableBase) as typeof ProgramsTableBase;
