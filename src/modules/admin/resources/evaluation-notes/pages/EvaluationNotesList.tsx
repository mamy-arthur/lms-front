'use client';

import { LayoutGrid, List } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  EvaluationNotesSearch,
  EvaluationNotesDrawer,
  EvaluationNotesTable,
  FormationSummaryCard,
} from '@/modules/shared/components/evaluation-notes';
import type { DataTableColumn } from '@/shared/components/ui/DataTable';
import { type FormationSummary } from '@/modules/shared/lib/evaluation-notes';
import { useEvaluationNotesQuery } from '../hooks/useEvaluationNotesQuery';
import { useFormationEvaluationNotesQuery } from '../hooks/useFormationEvaluationNotesQuery';
import { learningPathCover } from '@/shared/lib/learning-path-cover';

export function EvaluationNotesList() {
  const [search, setSearch] = useState('');
  const [clientFilter, setClientFilter] = useState('all');
  const [selectedFormation, setSelectedFormation] = useState<FormationSummary | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [view, setView] = useState<'card' | 'table'>('table');

  const debouncedSearch = useDebounce(search, 400);

  const { data, isLoading, isError } = useEvaluationNotesQuery({
    q: debouncedSearch || undefined,
    tenant_id: clientFilter !== 'all' ? clientFilter : undefined,
  });

  const {
    data: detailData,
    isLoading: isDetailLoading,
    isError: isDetailError,
  } = useFormationEvaluationNotesQuery(selectedFormation?.id ?? null);

  const formations = data?.data ?? [];
  const clientOptions = data?.clients ?? [];
  const hasQuery = Boolean(debouncedSearch || clientFilter !== 'all');

  function openDrawer(formation: FormationSummary) {
    setSelectedFormation(formation);
    setDrawerOpen(true);
  }

  const tableColumns: DataTableColumn<FormationSummary>[] = useMemo(
    () => [
      {
        key: 'name',
        label: 'Formation',
        sortable: true,
        render: (row) => (
          <div className="flex items-center gap-3">
            <div className="size-9 shrink-0 overflow-hidden rounded-sm bg-muted">
              <img
                src={learningPathCover(row.coverImage)}
                alt={row.name}
                className="h-full w-full object-cover"
              />
            </div>
            <span className="font-medium">{row.name}</span>
          </div>
        ),
      },
      {
        key: 'category',
        label: 'Catégorie',
        render: (row) => <span className="text-muted-foreground">{row.category ?? '—'}</span>,
      },
      {
        key: 'traineeCount',
        label: 'Stagiaires',
        sortable: true,
        render: (row) => <span className="block ">{row.traineeCount}</span>,
      },
      {
        key: 'evaluationCount',
        label: 'Évaluations',
        sortable: true,
        render: (row) => <span className="block ">{row.evaluationCount}</span>,
      },
      {
        key: 'avgScore',
        label: 'Moyenne',
        sortable: true,
        render: (row) => (
          <span
            className={`block  font-semibold ${row.avgScore >= 50 ? 'text-emerald-600' : 'text-red-500'}`}
          >
            {row.avgScore}%
          </span>
        ),
      },
      {
        key: 'successRate',
        label: 'Taux de réussite',
        sortable: true,
        render: (row) => (
          <span
            className={`block  font-semibold ${row.successRate >= 50 ? 'text-emerald-600' : 'text-red-500'}`}
          >
            {row.successRate}%
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <div className="bg-background pb-3">
      <div className="mx-auto w-full max-w-[1800px] space-y-8">
        <header className="m-0 mb-2 p-0">
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight">Notes de formation</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Suivez la performance des stagiaires par formation avec une vue claire et actionnable.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <EvaluationNotesSearch
              value={search}
              onChange={setSearch}
              placeholder="Rechercher une formation…"
            />
            <div className="flex items-center gap-1">
              <div className="flex items-center rounded-md border bg-muted/40 p-0.5">
                <Button
                  variant="ghost"
                  size="icon"
                  className={`size-6 ${view === 'card' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  onClick={() => setView('card')}
                  title="Vue cartes"
                >
                  <LayoutGrid className="size-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`size-6 ${view === 'table' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  onClick={() => setView('table')}
                  title="Vue tableau"
                >
                  <List className="size-3" />
                </Button>
              </div>
              <Select value={clientFilter} onValueChange={setClientFilter}>
                <SelectTrigger className="w-55 border-border/60 bg-background focus:ring-(--color-primary)">
                  <SelectValue placeholder="Tous les clients" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les clients</SelectItem>
                  {clientOptions.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </header>

        {isError ? (
          <div className="rounded-2xl border border-dashed border-red-200 bg-red-50 p-10 text-center text-sm text-red-600">
            Une erreur est survenue lors du chargement des données.
          </div>
        ) : view === 'table' ? (
          <EvaluationNotesTable
            data={formations}
            columns={tableColumns}
            isLoading={isLoading}
            hasQuery={hasQuery}
            onRowClick={openDrawer}
            emptyState={{
              title: 'Aucune formation',
              filteredTitle: 'Aucun résultat',
              filteredDescription: 'Essayez de modifier vos filtres.',
            }}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {formations.map((formation) => (
              <FormationSummaryCard
                key={formation.id}
                formation={formation}
                onClick={() => openDrawer(formation)}
              />
            ))}
          </div>
        )}
        {!isLoading && !isError && formations.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-10 text-center text-sm text-muted-foreground">
            Aucune donnée ne correspond aux filtres sélectionnés.
          </div>
        )}
      </div>

      <EvaluationNotesDrawer
        formation={selectedFormation}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        hasQuery={hasQuery}
        detail={detailData?.data}
        isDetailLoading={isDetailLoading}
        isDetailError={isDetailError}
        showClientColumn
        width="50vw"
      />
    </div>
  );
}
