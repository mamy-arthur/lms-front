'use client';

import { useId, useRef, useState } from 'react';
import { PanelRightClose } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import {
  formatAttemptDate,
  formatAttemptDuration,
  getDemoEnrollmentSummary,
  getDemoStudentAttempts,
  type EnrollmentLateness,
} from '../data/studentAttemptsDemo';
import {
  enrollmentStatuses,
  getDemoFormationStudents,
  type DashboardEnrollmentStatus,
  type FormationProgressDemo,
} from '../data/studentProgressDemo';
import { StudentAttemptHistory } from './StudentAttemptHistory';

export type FormationStudentSelection = {
  formation: FormationProgressDemo;
  status: DashboardEnrollmentStatus;
};

const LATENESS: Record<EnrollmentLateness, { label: string; className: string }> = {
  on_time: {
    label: 'Dans les temps',
    className:
      'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300',
  },
  late: {
    label: 'En retard',
    className:
      'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300',
  },
  finished_late: {
    label: 'Terminé en retard',
    className:
      'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300',
  },
};

const DATE_CELL = 'px-3 py-2 text-xs whitespace-nowrap text-muted-foreground';

export function FormationStudentsSheet({
  selection,
  onClose,
  onRestoreFocus,
}: {
  selection: FormationStudentSelection | null;
  onClose: () => void;
  onRestoreFocus: () => void;
}) {
  return (
    <Sheet
      open={selection !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <FormationStudentsContent
        key={selection ? `${selection.formation.id}-${selection.status}` : 'closed'}
        selection={selection}
        onRestoreFocus={onRestoreFocus}
      />
    </Sheet>
  );
}

function FormationStudentsContent({
  selection,
  onRestoreFocus,
}: {
  selection: FormationStudentSelection | null;
  onRestoreFocus: () => void;
}) {
  const students = selection ? getDemoFormationStudents(selection.formation, selection.status) : [];
  const [studentId, setStudentId] = useState<string | null>(null);
  const detailId = useId();
  const rowButtons = useRef(new Map<string, HTMLButtonElement>());
  const status = enrollmentStatuses.find((item) => item.key === selection?.status);
  const student = students.find((item) => item.id === studentId);
  const attempts =
    selection && student
      ? getDemoStudentAttempts(selection.formation, selection.status, student.id)
      : [];

  /** Rend sa pleine largeur au tableau et repose le focus sur la ligne quittée. */
  const collapse = () => {
    setStudentId(null);
    // Le tableau est monté en permanence : le bouton est déjà là, pas d'effet.
    if (studentId) rowButtons.current.get(studentId)?.focus();
  };

  return (
    <SheetContent
      className="data-[side=right]:min-w-full"
      onCloseAutoFocus={(event) => {
        event.preventDefault();
        onRestoreFocus();
      }}
    >
      <SheetHeader className="shrink-0 border-b px-5 py-3.5">
        <div>
          <SheetTitle className="text-base">Étudiants · {status?.label}</SheetTitle>
          <SheetDescription className="text-muted-foreground text-xs">
            {selection?.formation.name}
          </SheetDescription>
        </div>
      </SheetHeader>

      {/*
        Le tableau occupe toute la largeur tant qu'aucune ligne n'est choisie.
        Les deux pistes existent toujours — la seconde à `0fr` — pour que le
        passage à deux colonnes s'interpole au lieu de sauter : une grille ne
        s'anime qu'à nombre de pistes constant.
      */}
      <div
        className={cn(
          'grid min-h-0 flex-1 transition-[grid-template-columns] duration-300 motion-reduce:transition-none',
          student
            ? 'lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]'
            : 'lg:grid-cols-[minmax(0,1fr)_minmax(0,0fr)]',
        )}
      >
        <div className="min-h-0 min-w-0 overflow-y-auto px-4 pb-6">
          <p className="px-2 py-3 text-xs text-muted-foreground">
            {students.length} étudiant{students.length > 1 ? 's' : ''} · Sélectionnez une ligne pour
            afficher son historique.
          </p>
          <table className="w-full border-separate border-spacing-y-1 text-sm">
            <caption className="sr-only">Étudiants concernés</caption>
            <thead>
              <tr className="text-xs text-muted-foreground">
                <th scope="col" className="px-3 pb-1 text-left font-medium">
                  Étudiant
                </th>
                <th scope="col" className="px-3 pb-1 text-left font-medium">
                  Début
                </th>
                <th scope="col" className="px-3 pb-1 text-left font-medium">
                  Fin
                </th>
                <th scope="col" className="px-3 pb-1 text-right font-medium">
                  Temps passé
                </th>
                <th scope="col" className="px-3 pb-1 text-right font-medium">
                  Tentatives
                </th>
                <th scope="col" className="px-3 pb-1 text-left font-medium">
                  Échéance
                </th>
                <th scope="col" className="px-3 pb-1 text-left font-medium">
                  Statut
                </th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 && (
                <tr>
                  <td colSpan={7} className="rounded-sm border border-dashed px-3 py-8 text-center">
                    <span className="text-sm font-medium">Aucun étudiant dans ce statut.</span>
                  </td>
                </tr>
              )}
              {students.map((item) => {
                const summary = selection
                  ? getDemoEnrollmentSummary(selection.formation, selection.status, item.id)
                  : null;
                const lateness = summary ? LATENESS[summary.lateness] : null;
                const current = item.id === studentId;

                return (
                  <tr
                    key={item.id}
                    data-current={current}
                    onClick={() => setStudentId(item.id)}
                    className="group cursor-pointer [&>td]:border-y [&>td]:bg-card [&>td]:transition-colors hover:[&>td]:bg-primary/10 data-[current=true]:[&>td]:border-(--color-primary) data-[current=true]:[&>td]:bg-(--color-primary)/10"
                  >
                    <td className="max-w-50 px-3 py-2">
                      <button
                        type="button"
                        ref={(node) => {
                          if (node) rowButtons.current.set(item.id, node);
                          else rowButtons.current.delete(item.id);
                        }}
                        aria-label={`Voir les tentatives de ${item.name}`}
                        aria-current={current}
                        // Le volet n'existe pas tant qu'il est replié.
                        aria-controls={student ? detailId : undefined}
                        className="flex w-full items-center gap-2 rounded-sm text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        onClick={(event) => {
                          // La ligne entière porte déjà la même sélection.
                          event.stopPropagation();
                          setStudentId(item.id);
                        }}
                      >
                        <Avatar size="lg" aria-hidden="true" className="shrink-0">
                          <AvatarFallback className="bg-muted text-primary transition-colors group-data-[current=true]:bg-(--color-primary) group-data-[current=true]:text-primary-foreground text-xs">
                            ET
                          </AvatarFallback>
                        </Avatar>
                        <span className="min-w-0 flex-1">
                          <span
                            className="block truncate font-medium group-data-[current=true]:text-primary"
                            title={item.name}
                          >
                            {item.name}
                          </span>
                          <span
                            className="block truncate text-xs text-muted-foreground"
                            title={item.email}
                          >
                            {item.email}
                          </span>
                        </span>
                      </button>
                    </td>
                    <td className={DATE_CELL}>
                      {summary?.startedAt ? (
                        <time dateTime={summary.startedAt}>
                          {formatAttemptDate(summary.startedAt)}
                        </time>
                      ) : (
                        'Non démarré'
                      )}
                    </td>
                    <td className={DATE_CELL}>
                      {summary?.endedAt ? (
                        <time dateTime={summary.endedAt}>{formatAttemptDate(summary.endedAt)}</time>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-3 py-2 text-right text-xs whitespace-nowrap tabular-nums">
                      {summary?.attempts ? formatAttemptDuration(summary.minutes) : '—'}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">{summary?.attempts ?? 0}</td>
                    <td className={DATE_CELL}>
                      {summary && (
                        <time dateTime={summary.dueAt}>{formatAttemptDate(summary.dueAt)}</time>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {lateness && (
                        <span
                          className={cn(
                            'inline-block rounded-sm border px-1.5 py-0.5 text-[10px] font-medium whitespace-nowrap',
                            lateness.className,
                          )}
                        >
                          {lateness.label}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Replié, le volet ne rend rien : rien à atteindre au clavier. */}
        <div className="min-h-0 min-w-0 overflow-hidden">
          {student && (
            <section
              id={detailId}
              aria-labelledby={`${detailId}-title`}
              className="h-full overflow-y-auto border-t p-4 sm:p-6 lg:border-t-0 lg:border-l"
            >
              <div className="mb-5 flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <h2 id={`${detailId}-title`} className="text-base font-semibold">
                    Tentatives de {student.name}
                  </h2>
                  <p className="break-all text-xs text-muted-foreground">{student.email}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 shrink-0 px-2 text-xs"
                  onClick={collapse}
                >
                  <PanelRightClose aria-hidden="true" className="size-3.5" />
                  Replier
                </Button>
              </div>
              <StudentAttemptHistory key={student.id} attempts={attempts} />
            </section>
          )}
        </div>
      </div>
    </SheetContent>
  );
}
