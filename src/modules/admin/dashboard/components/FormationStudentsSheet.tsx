'use client';

import { useId, useRef, useState } from 'react';
import { CalendarClock, Clock, PanelRightClose, Search } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { normalizeSearch } from '@/shared/lib/string/normalizeSearch';
import {
  formatAttemptDate,
  formatAttemptDuration,
  formatShortDate,
  getDemoEnrollmentSummary,
  getDemoStudentAttempts,
} from '../data/studentAttemptsDemo';
import {
  getDemoFormationRoster,
  type DashboardEnrollmentStatus,
  type FormationProgressDemo,
} from '../data/studentProgressDemo';
import { StudentAttemptHistory } from './StudentAttemptHistory';

export type FormationStudentSelection = {
  formation: FormationProgressDemo;
  status: DashboardEnrollmentStatus;
};

const DATE_CELL = 'px-3 py-2 text-xs whitespace-nowrap text-muted-foreground';

/**
 * Libellés du statut par étudiant. Distincts de `enrollmentStatuses`, qui
 * qualifie des *inscriptions* au féminin pluriel (« Terminées ») et sert la
 * synthèse du tableau de bord : les couleurs y sont aussi différentes.
 */
const STUDENT_STATUS: Record<DashboardEnrollmentStatus, { label: string; className: string }> = {
  not_started: {
    label: 'Non commencé',
    className:
      'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300',
  },
  in_progress: {
    label: 'En cours',
    className:
      'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300',
  },
  completed: {
    label: 'Terminé',
    className:
      'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300',
  },
  failed: {
    label: 'Échoué',
    className:
      'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300',
  },
};

/** Ordre des badges de filtre, indépendant de celui de `enrollmentStatuses`. */
const STATUS_FILTERS = ['completed', 'in_progress', 'not_started', 'failed'] as const;

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
  // Tout l'effectif, pas seulement le statut cliqué : la colonne Statut et les
  // badges de filtre n'auraient aucun sens sur une liste déjà réduite à un seul.
  const students = selection ? getDemoFormationRoster(selection.formation) : [];
  const [studentId, setStudentId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  // Le statut cliqué sur le tableau de bord devient le filtre initial.
  const [statusFilter, setStatusFilter] = useState<DashboardEnrollmentStatus | null>(
    selection?.status ?? null,
  );
  const detailId = useId();
  const rowButtons = useRef(new Map<string, HTMLButtonElement>());

  const countByStatus = (value: DashboardEnrollmentStatus) =>
    students.filter((item) => item.status === value).length;

  const query = normalizeSearch(search);
  const visibleStudents = students.filter((item) => {
    if (statusFilter && item.status !== statusFilter) return false;
    if (!query) return true;
    return (
      normalizeSearch(item.name).includes(query) || normalizeSearch(item.email).includes(query)
    );
  });

  // Cherché parmi tous les étudiants, pas seulement les visibles : filtrer ne
  // doit pas refermer l'historique que l'on est en train de lire.
  const student = students.find((item) => item.id === studentId);
  const attempts =
    selection && student
      ? getDemoStudentAttempts(selection.formation, student.status, student.id)
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
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <SheetTitle className="text-base">{selection?.formation.name}</SheetTitle>
            <SheetDescription className="text-muted-foreground text-xs">
              Critère de fin : {selection?.formation.completionCriterion}
            </SheetDescription>
          </div>
          {selection && (
            <div className="mr-5 flex shrink-0 items-stretch gap-2 text-xs">
              {/*
                Même habillage que l'alerte voisine, mais ce n'est pas une
                alerte : `role` est neutralisé pour ne pas créer une live region
                sur une donnée purement informative et jamais mise à jour.
              */}
              <Alert role={undefined} className="w-auto border">
                <Clock aria-hidden="true" />
                <AlertTitle>Durée théorique</AlertTitle>
                <AlertDescription className="font-semibold tabular-nums text-foreground">
                  {formatAttemptDuration(selection.formation.theoreticalMinutes)}
                </AlertDescription>
              </Alert>
              <Alert variant="destructive" className="w-auto bg-red-50 border-0 rounded-sm">
                <CalendarClock aria-hidden="true" />
                <AlertTitle>Expiration de la formation</AlertTitle>
                <AlertDescription className="tabular-nums text-destructive">
                  <time dateTime={selection.formation.expiresAt}>
                    {formatShortDate(selection.formation.expiresAt)}
                  </time>
                </AlertDescription>
              </Alert>
            </div>
          )}
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
          {/* Collé en haut : la recherche doit rester atteignable en défilant. */}
          <div className="sticky top-0 z-10 space-y-2 bg-background  py-3 flex justify-between items-center ">
            {students.length > 0 && (
              <div className="relative">
                <Search
                  aria-hidden="true"
                  className="pointer-events-none absolute top-2.5 left-2.5 size-4 text-muted-foreground"
                />
                <Input
                  type="search"
                  aria-label="Rechercher un étudiant"
                  placeholder="Rechercher par nom ou e-mail…"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="h-8 pl-8 w-100"
                />
              </div>
            )}
            {students.length > 0 && (
              <div
                role="group"
                aria-label="Filtrer par statut"
                className="flex flex-wrap gap-1.5 px-2"
              >
                <button
                  type="button"
                  aria-pressed={statusFilter === null}
                  onClick={() => setStatusFilter(null)}
                  className="rounded-sm border px-2 py-1 text-xs transition-colors hover:bg-muted aria-pressed:border-(--color-primary) aria-pressed:bg-(--color-primary)/10 aria-pressed:font-semibold"
                >
                  Tous ({students.length})
                </button>
                {STATUS_FILTERS.map((value) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={statusFilter === value}
                    onClick={() => setStatusFilter(value)}
                    className={cn(
                      'rounded-sm border px-2 py-1 text-xs transition-colors hover:brightness-95 aria-pressed:font-semibold aria-pressed:ring-1 aria-pressed:ring-current',
                      STUDENT_STATUS[value].className,
                    )}
                  >
                    {STUDENT_STATUS[value].label} ({countByStatus(value)})
                  </button>
                ))}
              </div>
            )}
          </div>

          <table className="w-full border-separate border-spacing-y-1 text-sm">
            <caption className="sr-only">Étudiants concernés</caption>
            <thead>
              <tr className="text-xs">
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
                  Accès valable jusqu’au
                </th>
                <th scope="col" className="px-3 pb-1 text-left font-medium">
                  Statut
                </th>
              </tr>
            </thead>
            <tbody>
              {visibleStudents.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="space-y-2 rounded-sm border border-dashed px-3 py-8 text-center"
                  >
                    <p className="text-sm font-medium">
                      {students.length === 0
                        ? 'Aucun étudiant inscrit à cette formation.'
                        : 'Aucun étudiant ne correspond à votre recherche.'}
                    </p>
                    {students.length > 0 && (
                      <Button type="button" variant="outline" onClick={() => setSearch('')}>
                        Effacer la recherche
                      </Button>
                    )}
                  </td>
                </tr>
              )}
              {visibleStudents.map((item) => {
                const summary = selection
                  ? getDemoEnrollmentSummary(selection.formation, item.status, item.id)
                  : null;
                const current = item.id === studentId;
                // Vert tant que l'étudiant reste sous la durée théorique, rouge
                // dès qu'il la dépasse. Sans tentative il n'y a pas de temps à
                // juger : la valeur reste neutre plutôt que « bonne ».
                const withinBudget = summary?.attempts
                  ? summary.minutes < (selection?.formation.theoreticalMinutes ?? 0)
                  : null;

                return (
                  <tr
                    key={item.id}
                    data-current={current}
                    onClick={() => setStudentId(item.id)}
                    className="group cursor-pointer [&>td]:border-y [&>td]:bg-card [&>td]:transition-colors hover:[&>td]:bg-gray-100/50 data-[current=true]:[&>td]:border-(--color-primary) data-[current=true]:[&>td]:bg-(--color-primary)/10"
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
                    <td
                      className={cn(
                        'px-3 py-2 text-right text-xs font-medium whitespace-nowrap tabular-nums',
                        withinBudget === true && 'text-emerald-600 dark:text-emerald-400',
                        withinBudget === false && 'text-red-600 dark:text-red-400',
                        withinBudget === null && 'text-muted-foreground',
                      )}
                    >
                      {summary?.attempts ? formatAttemptDuration(summary.minutes) : '—'}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">{summary?.attempts ?? 0}</td>
                    <td className={DATE_CELL}>
                      {summary && (
                        <time
                          dateTime={summary.accessEndsAt}
                          // Souligné quand c'est l'expiration de la formation qui
                          // tronque l'accès, et non l'échéance de l'étudiant.
                          title={
                            summary.cappedByFormation
                              ? 'Limité par l’expiration de la formation'
                              : undefined
                          }
                          className={cn(summary.cappedByFormation && 'font-medium text-foreground')}
                        >
                          {formatShortDate(summary.accessEndsAt)}
                        </time>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={cn(
                          'inline-block rounded-sm border px-1.5 py-0.5 text-[10px] font-medium whitespace-nowrap',
                          STUDENT_STATUS[item.status].className,
                        )}
                      >
                        {STUDENT_STATUS[item.status].label}
                      </span>
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
