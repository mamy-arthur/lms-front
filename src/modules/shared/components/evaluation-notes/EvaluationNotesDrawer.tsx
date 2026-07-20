'use client';

import { useMemo } from 'react';
import { GraduationCap, Loader2 } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { EvaluationNotesTable } from './EvaluationNotesTable';
import { buildDrawerColumns, buildRows } from './list-helpers';
import { type FormationDetail, type FormationSummary } from '@/modules/shared/lib/evaluation-notes';
import { useFormationTableController } from '@/modules/shared/hooks/useFormationTableController';

export interface EvaluationNotesDrawerProps {
  formation: FormationSummary | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hasQuery?: boolean;
  detail: FormationDetail | undefined;
  isDetailLoading: boolean;
  isDetailError?: boolean;
  showClientColumn?: boolean;
  width?: string;
}

export function EvaluationNotesDrawer({
  formation,
  open,
  onOpenChange,
  hasQuery = false,
  detail,
  isDetailLoading,
  isDetailError = false,
  showClientColumn = false,
  width = '50vw',
}: EvaluationNotesDrawerProps) {
  const formationTable = useFormationTableController();

  const rows = useMemo(() => (detail ? buildRows(detail.rows) : []), [detail]);

  const columns = useMemo(
    () => (detail ? buildDrawerColumns(detail.evaluations, showClientColumn) : []),
    [detail, showClientColumn],
  );

  const state = formationTable.getGroupState(formation?.id ?? '');

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton
        style={{ width, maxWidth: width }}
        className="flex flex-col gap-0 p-0"
      >
        <SheetHeader className="shrink-0 border-b px-6 py-4">
          <div className="flex items-center gap-3 pr-8">
            {formation?.coverImage ? (
              <div className="size-10 shrink-0 overflow-hidden rounded-lg bg-muted">
                <img
                  src={formation.coverImage}
                  alt={formation.name}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <GraduationCap className="size-5" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <SheetTitle className="truncate text-sm font-semibold">
                  {formation?.name ?? '—'}
                </SheetTitle>
              </div>
              <SheetDescription className="mt-0.5 text-xs text-muted-foreground">
                {formation?.category && (
                  <span className="mr-2 text-muted-foreground/70">{formation.category} ·</span>
                )}
                {isDetailLoading ? (
                  'Chargement…'
                ) : (
                  <>
                    <span className="text-foreground">{rows.length}</span> stagiaire(s) ·{' '}
                    <span className="text-foreground">{detail?.evaluations.length ?? 0}</span>{' '}
                    évaluation(s)
                  </>
                )}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-auto px-6 py-4">
          {isDetailLoading ? (
            <div className="flex h-40 items-center justify-center text-muted-foreground">
              <Loader2 className="mr-2 size-4 animate-spin" />
              <span className="text-sm">Chargement des notes…</span>
            </div>
          ) : isDetailError ? (
            <div className="flex h-40 items-center justify-center text-red-500">
              <span className="text-sm">Erreur lors du chargement des notes.</span>
            </div>
          ) : (
            <EvaluationNotesTable
              data={rows}
              columns={columns}
              isLoading={false}
              hasQuery={hasQuery}
              page={state.page}
              pageSize={state.pageSize}
              total={rows.length}
              onPageChange={(p) => formationTable.handlePageChange(formation?.id ?? '', p)}
              onPageSizeChange={(s) => formationTable.handlePageSizeChange(formation?.id ?? '', s)}
              initialSort={{ column: 'traineeName', direction: 'asc' }}
              emptyState={{
                title: 'Aucune note disponible',
                description: 'Cette formation ne contient encore aucune note.',
              }}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
