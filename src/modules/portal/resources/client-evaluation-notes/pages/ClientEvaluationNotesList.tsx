'use client';

import { useState } from 'react';
import {
  EvaluationNotesSearch,
  EvaluationNotesDrawer,
  FormationSummaryCard,
} from '@/modules/shared/components/evaluation-notes';
import { type FormationSummary } from '@/modules/shared/lib/evaluation-notes';
import { useClientEvaluationNotesQuery } from '../hooks/useClientEvaluationNotesQuery';
import { useClientFormationEvaluationNotesQuery } from '../hooks/useClientFormationEvaluationNotesQuery';

export function ClientEvaluationNotesList() {
  const [search, setSearch] = useState('');
  const [selectedFormation, setSelectedFormation] = useState<FormationSummary | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { data, isLoading, isError } = useClientEvaluationNotesQuery();
  const formations = data?.data ?? [];

  const {
    data: detailData,
    isLoading: isDetailLoading,
    isError: isDetailError,
  } = useClientFormationEvaluationNotesQuery(selectedFormation?.id ?? null);

  const filtered = search
    ? formations.filter((f) => f.name.toLowerCase().includes(search.trim().toLowerCase()))
    : formations;

  function openDrawer(formation: FormationSummary) {
    setSelectedFormation(formation);
    setDrawerOpen(true);
  }

  return (
    <div className="bg-background pb-3">
      <div className="mx-auto w-full space-y-8">
        <header className="mb-4 space-y-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Notes de formation</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Consultez les résultats de vos stagiaires par formation avec une vue claire et
              actionnable.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <EvaluationNotesSearch
              value={search}
              onChange={setSearch}
              placeholder="Rechercher une formation…"
            />
            <p className="shrink-0 text-xs text-muted-foreground">
              <span className="text-primary">{filtered.length}</span> formation(s)
            </p>
          </div>
        </header>

        {isError ? (
          <div className="rounded-2xl border border-dashed border-red-200 bg-red-50 p-10 text-center text-sm text-red-600">
            Une erreur est survenue lors du chargement des données.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((formation) => (
              <FormationSummaryCard
                key={formation.id}
                formation={formation}
                onClick={() => openDrawer(formation)}
              />
            ))}
          </div>
        )}
        {!isLoading && !isError && filtered.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-10 text-center text-sm text-muted-foreground">
            Aucune donnée disponible pour votre organisation.
          </div>
        )}
      </div>

      <EvaluationNotesDrawer
        formation={selectedFormation}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        hasQuery={Boolean(search)}
        detail={detailData?.data}
        isDetailLoading={isDetailLoading}
        isDetailError={isDetailError}
        width="50vw"
      />
    </div>
  );
}
