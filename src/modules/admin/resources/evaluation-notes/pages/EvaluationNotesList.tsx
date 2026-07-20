'use client';

import { useState } from 'react';
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
  FormationSummaryCard,
} from '@/modules/shared/components/evaluation-notes';
import { type FormationSummary } from '@/modules/shared/lib/evaluation-notes';
import { useEvaluationNotesQuery } from '../hooks/useEvaluationNotesQuery';
import { useFormationEvaluationNotesQuery } from '../hooks/useFormationEvaluationNotesQuery';

export function EvaluationNotesList() {
  const [search, setSearch] = useState('');
  const [clientFilter, setClientFilter] = useState('all');
  const [selectedFormation, setSelectedFormation] = useState<FormationSummary | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { data, isLoading, isError } = useEvaluationNotesQuery({
    q: search || undefined,
    tenant_id: clientFilter !== 'all' ? clientFilter : undefined,
  });

  const {
    data: detailData,
    isLoading: isDetailLoading,
    isError: isDetailError,
  } = useFormationEvaluationNotesQuery(selectedFormation?.id ?? null);

  const formations = data?.data ?? [];
  const clientOptions = data?.clients ?? [];
  const hasQuery = Boolean(search || clientFilter !== 'all');

  function openDrawer(formation: FormationSummary) {
    setSelectedFormation(formation);
    setDrawerOpen(true);
  }

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
            <div className="flex items-center gap-3">
              <p className="shrink-0 text-xs text-muted-foreground">
                <span className="text-primary">{formations.length}</span> formation(s)
              </p>
              <Select value={clientFilter} onValueChange={setClientFilter}>
                <SelectTrigger className="h-10 w-[220px] border-border/60 bg-background focus:ring-(--color-primary)">
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
