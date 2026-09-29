'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { ChevronRight, Clock, PanelRightClose, Search } from 'lucide-react';
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
import { StudentContactButton } from '@/modules/shared/components/StudentContactButton';
import { getInitials } from '@/shared/lib/string/getInitials';
import { useDebounce } from '@/shared/hooks/useDebounce';
import type { EnrollmentStatus } from '@/shared/types/enrollment.types';
import { useDashboardScope, useFormationEnrollmentsQuery } from '../hooks/useEditorDashboardQuery';
import type { DashboardEnrollment, DashboardFormation } from '../types';
import {
  formatAttemptDate,
  formatAttemptDuration,
  formatShortDate,
  formatTrackedDuration,
} from '@/modules/shared/lib/studentProgressFormatters';
import {
  DateRangeColumnFilter,
  EMPTY_DATE_RANGE,
  isDateRangeActive,
  type DateRange,
} from '@/modules/shared/components/dashboard/DateRangeColumnFilter';
import { StudentAttemptHistory } from '@/modules/shared/components/dashboard/StudentAttemptHistory';

export type FormationStudentSelection = {
  formation: DashboardFormation;
  /** Filtre de statut initial. `null` ouvre le panneau sur tout l'effectif. */
  status: EnrollmentStatus | null;
};

const DATE_CELL = 'px-3 py-2 text-xs whitespace-nowrap text-muted-foreground';

/**
 * Libellés du statut par étudiant. Distincts de `enrollmentStatuses`, qui
 * qualifie des *inscriptions* au féminin pluriel (« Terminées ») et sert la
 * synthèse du tableau de bord : les couleurs y sont aussi différentes.
 */
const STUDENT_STATUS: Record<EnrollmentStatus, { label: string; className: string }> = {
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
  expired: {
    label: 'Expiré',
    className:
      'border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300',
  },
};

/** Ordre des badges de filtre, indépendant de celui de `enrollmentStatuses`. */
const STATUS_FILTERS = ['completed', 'in_progress', 'not_started', 'failed', 'expired'] as const;

/**
 * Colonnes filtrables par plage de dates, dans leur ordre d'affichage. La clé
 * correspond à la date réelle de l'inscription renvoyée par le serveur.
 */
const DATE_COLUMNS = [
  { key: 'startedAt', label: 'Début' },
  { key: 'endedAt', label: 'Fin' },
  { key: 'accessEndsAt', label: 'Accès valable jusqu’au' },
] as const satisfies readonly { key: keyof DashboardEnrollment; label: string }[];

type DateColumnKey = (typeof DATE_COLUMNS)[number]['key'];
const PER_PAGE = 20;
const INITIAL_DATE_FILTERS = {
  startedAt: EMPTY_DATE_RANGE,
  endedAt: EMPTY_DATE_RANGE,
  accessEndsAt: EMPTY_DATE_RANGE,
};

export function FormationStudentsSheet({
  selection,
  onClose,
  onRestoreFocus,
}: {
  selection: FormationStudentSelection | null;
  onClose: () => void;
  onRestoreFocus: () => void;
}) {
  const scope = useDashboardScope();
  const visible = selection !== null && scope.enabled;
  return (
    <Sheet
      open={visible}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      {visible && (
        <FormationStudentsContent
          key={`${JSON.stringify(scope.key)}-${selection.formation.id}-${selection.status}`}
          selection={selection}
          onRestoreFocus={onRestoreFocus}
        />
      )}
    </Sheet>
  );
}

function FormationStudentsContent({
  selection,
  onRestoreFocus,
}: {
  selection: FormationStudentSelection;
  onRestoreFocus: () => void;
}) {
  // Keep the selected enrollment while filtering/paging, never identify a row by learner ID:
  // a learner may have several distinct enrollments and histories for the same formation.
  const [student, setStudent] = useState<DashboardEnrollment | null>(null);
  const [searchState, setSearchState] = useState({ value: '', page: 1 });
  const search = searchState.value;
  const debouncedSearch = useDebounce(search);
  const page = search === debouncedSearch ? searchState.page : 1;
  // Le statut cliqué sur le tableau de bord devient le filtre initial.
  const [statusFilter, setStatusFilter] = useState<EnrollmentStatus | null>(selection.status);
  const [dateFilters, setDateFilters] =
    useState<Record<DateColumnKey, DateRange>>(INITIAL_DATE_FILTERS);
  const detailId = useId();
  const rowButtons = useRef(new Map<string, HTMLButtonElement>());
  const searchRef = useRef<HTMLInputElement>(null);

  const query = useFormationEnrollmentsQuery(selection.formation.id, {
    status: statusFilter ?? undefined,
    q: debouncedSearch.trim(),
    page,
    per_page: PER_PAGE,
    started_at_from: dateFilters.startedAt.from || undefined,
    started_at_to: dateFilters.startedAt.to || undefined,
    ended_at_from: dateFilters.endedAt.from || undefined,
    ended_at_to: dateFilters.endedAt.to || undefined,
    expires_at_from: dateFilters.accessEndsAt.from || undefined,
    expires_at_to: dateFilters.accessEndsAt.to || undefined,
  });
  const students = query.data?.enrollments ?? [];
  const meta = query.data?.meta;
  const pages = Math.max(1, Math.ceil((meta?.total ?? 0) / (meta?.per_page ?? PER_PAGE)));
  const durationMinutes = meta?.formation.duration_minutes;
  const isFetching = query.isFetching || search !== debouncedSearch;

  // Revient à la page 1 si les inscriptions ont rétréci sous la page consultée (ex. réinscription
  // ou suppression concurrente), au lieu de laisser la page vide indéfiniment.
  useEffect(() => {
    if (!query.isPending && students.length === 0 && (meta?.total ?? 0) > 0 && page > 1) {
      setSearchState((previous) => ({ ...previous, page: 1 }));
    }
  }, [query.isPending, students.length, meta?.total, page]);

  const updateStatus = (status: EnrollmentStatus | null) => {
    setStatusFilter(status);
    setSearchState((previous) => ({ ...previous, page: 1 }));
  };
  const updateDateFilter = (key: DateColumnKey, range: DateRange) => {
    setDateFilters((previous) => ({ ...previous, [key]: range }));
    setSearchState((previous) => ({ ...previous, page: 1 }));
  };

  const activeDateFilters = DATE_COLUMNS.filter(({ key }) =>
    isDateRangeActive(dateFilters[key]),
  ).length;
  const isFiltered = Boolean(search.trim()) || statusFilter !== null || activeDateFilters > 0;

  const resetFilters = () => {
    setSearchState({ value: '', page: 1 });
    setStatusFilter(null);
    setDateFilters(INITIAL_DATE_FILTERS);
  };

  /** Rend sa pleine largeur au tableau et repose le focus sur la ligne quittée. */
  const collapse = () => {
    setStudent(null);
    // Si la ligne n'est plus sur la page filtrée, revenir au champ de recherche.
    if (student) {
      const button = rowButtons.current.get(student.id);
      if (button) button.focus();
      else searchRef.current?.focus();
    }
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
            <SheetTitle className="text-base">{selection.formation.name}</SheetTitle>
            <SheetDescription className="text-muted-foreground text-xs">
              Inscriptions et historique des tentatives, réinscriptions incluses.
            </SheetDescription>
          </div>
          {durationMinutes != null && (
            <div className="mr-5 flex shrink-0 items-stretch gap-2 text-xs">
              {/*
                Information de catalogue, pas une alerte : inutile de créer
                une live region lors de chaque chargement des filtres.
              */}
              <Alert
                role={undefined}
                className="w-auto border bg-amber-50 border-amber-100 text-amber-600 rounded-sm"
              >
                <Clock aria-hidden="true" />
                <AlertTitle>Durée théorique</AlertTitle>
                <AlertDescription className="tabular-nums text-amber-600">
                  {formatAttemptDuration(durationMinutes)}
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
          <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 bg-background py-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search
                  aria-hidden="true"
                  className="pointer-events-none absolute top-2.5 left-2.5 size-4 text-muted-foreground"
                />
                <Input
                  ref={searchRef}
                  type="search"
                  aria-label="Rechercher un étudiant"
                  placeholder="Rechercher par nom ou e-mail…"
                  value={search}
                  onChange={(event) => setSearchState({ value: event.target.value, page: 1 })}
                  className={cn(
                    'h-8 pl-8 transition-[width] duration-300 motion-reduce:transition-none',
                    // Le volet de détail réduit la colonne de moitié : à 25rem
                    // le champ y écraserait les badges de statut.
                    student ? 'w-64 max-w-full' : 'w-80 max-w-full',
                  )}
                />
              </div>
              {/*
                  Live region : sans elle, appliquer un filtre réduirait le
                  tableau en silence, sans rien annoncer au lecteur d'écran.
                */}
              <p
                role="status"
                aria-live="polite"
                className="shrink-0 text-xs whitespace-nowrap text-muted-foreground"
              >
                {isFetching
                  ? 'Chargement des inscriptions…'
                  : query.isError
                    ? 'Inscriptions indisponibles'
                    : `${meta?.total ?? 0} sur ${meta?.summary.total ?? 0} inscriptions`}
              </p>
            </div>
            <div
              role="group"
              aria-label="Filtrer par statut"
              className="flex flex-wrap gap-1.5 px-2"
            >
              <button
                type="button"
                aria-pressed={statusFilter === null}
                onClick={() => updateStatus(null)}
                className="rounded-sm  px-2 py-1 text-xs transition-colors hover:bg-muted aria-pressed:border-(--color-primary) aria-pressed:bg-(--color-primary)/10"
              >
                Tous ({meta?.summary.total ?? '…'})
              </button>
              {STATUS_FILTERS.map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={statusFilter === value}
                  onClick={() => updateStatus(value)}
                  className={cn(
                    'rounded-sm  px-2 text-xs transition-colors hover:brightness-95 aria-pressed:ring-1 aria-pressed:ring-current',
                    STUDENT_STATUS[value].className,
                  )}
                >
                  {STUDENT_STATUS[value].label} (
                  {meta ? (meta.summary.status_counts[value] ?? 0) : '…'})
                </button>
              ))}
            </div>
          </div>

          <table
            aria-busy={isFetching}
            className="w-full border-separate border-spacing-y-1 text-sm"
          >
            <caption className="sr-only">Étudiants concernés</caption>
            <thead>
              <tr className="text-xs">
                <th scope="col" className="px-3 pb-1 text-left font-medium">
                  Étudiant
                </th>
                <th scope="col" className="px-3 pb-1 text-left font-medium">
                  Statut
                </th>
                {DATE_COLUMNS.slice(0, 2).map(({ key, label }) => (
                  <th key={key} scope="col" className="px-3 pb-1 text-left font-medium">
                    <span className="inline-flex items-center gap-1">
                      {label}
                      <DateRangeColumnFilter
                        label={label}
                        range={dateFilters[key]}
                        onApply={(range) => updateDateFilter(key, range)}
                      />
                    </span>
                  </th>
                ))}
                <th scope="col" className="px-3 pb-1 text-right font-medium">
                  Temps passé
                </th>
                <th scope="col" className="px-3 pb-1 text-right font-medium">
                  Tentatives
                </th>
                <th scope="col" className="px-3 pb-1 text-left font-medium">
                  <span className="inline-flex items-center gap-1">
                    {DATE_COLUMNS[2].label}
                    <DateRangeColumnFilter
                      label={DATE_COLUMNS[2].label}
                      range={dateFilters.accessEndsAt}
                      onApply={(range) => updateDateFilter('accessEndsAt', range)}
                    />
                  </span>
                </th>
                {/* Colonne du chevron : sans intitulé visible, mais nommée pour
                    ne pas laisser un en-tête vide aux lecteurs d'écran. */}
                <th scope="col" className="w-8 pb-1">
                  <span className="sr-only">Détails</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {query.isError ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center">
                    <div role="alert" className="space-y-3">
                      <p>Impossible de charger les inscriptions.</p>
                      <Button
                        variant="outline"
                        onClick={() => void query.refetch()}
                        disabled={query.isFetching}
                      >
                        Réessayer les inscriptions
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : query.isPending ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-muted-foreground">
                    Chargement…
                  </td>
                </tr>
              ) : (
                students.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="space-y-2 rounded-sm border border-dashed px-3 py-8 text-center"
                    >
                      <p className="text-sm font-medium">
                        {meta?.summary.total === 0
                          ? 'Aucun étudiant inscrit à cette formation.'
                          : 'Aucun étudiant ne correspond aux filtres.'}
                      </p>
                      {/* Un seul bouton : la recherche seule ne suffirait plus à
                        débloquer une liste vidée par une plage de dates. Rien à
                        réinitialiser si la formation n'a aucun inscrit. */}
                      {isFiltered && (
                        <Button type="button" variant="outline" onClick={resetFilters}>
                          Réinitialiser les filtres
                        </Button>
                      )}
                    </td>
                  </tr>
                )
              )}
              {!query.isError &&
                students.map((item) => {
                  const current = item.id === student?.id;
                  // Vert tant que l'étudiant reste sous la durée théorique, rouge
                  // dès qu'il la dépasse. Sans tentative il n'y a pas de temps à
                  // juger : la valeur reste neutre plutôt que « bonne ».
                  const withinBudget =
                    item.attempts > 0 && durationMinutes != null
                      ? item.timeSpentSeconds < durationMinutes * 60
                      : null;

                  return (
                    <tr
                      key={item.id}
                      data-current={current}
                      onClick={() => setStudent(item)}
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
                            setStudent(item);
                          }}
                        >
                          <Avatar size="lg" aria-hidden="true" className="shrink-0">
                            <AvatarFallback className="bg-muted text-primary transition-colors group-data-[current=true]:bg-(--color-primary) group-data-[current=true]:text-primary-foreground text-xs">
                              {getInitials(item.name)}
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
                              title={item.email ?? undefined}
                            >
                              {item.email ?? 'E-mail indisponible'}
                            </span>
                          </span>
                        </button>
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
                      <td className={DATE_CELL}>
                        {item.startedAt ? (
                          <time dateTime={item.startedAt}>{formatAttemptDate(item.startedAt)}</time>
                        ) : (
                          'Non démarré'
                        )}
                      </td>
                      <td className={DATE_CELL}>
                        {item.endedAt ? (
                          <time dateTime={item.endedAt}>{formatAttemptDate(item.endedAt)}</time>
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
                        {formatTrackedDuration(item.timeSpentSeconds)}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">{item.attempts}</td>
                      <td className={DATE_CELL}>
                        {item.accessEndsAt ? (
                          <time dateTime={item.accessEndsAt}>
                            {formatShortDate(item.accessEndsAt)}
                          </time>
                        ) : (
                          'Sans échéance'
                        )}
                      </td>
                      {/*
                      Chevron de fin de ligne : seul repère qui annonce qu'on
                      peut ouvrir le détail. Décoratif — le nom accessible de
                      l'action est déjà porté par le bouton de la 1re cellule.
                      Il glisse au survol pour se lire comme une action.
                    */}
                      <td className="px-3 py-2 text-right">
                        <ChevronRight
                          aria-hidden="true"
                          className="inline size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground group-data-[current=true]:text-(--color-primary)"
                        />
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
          {!query.isError && (pages > 1 || page > 1) && (
            <nav
              aria-label="Pagination des inscriptions"
              className="mt-4 flex items-center justify-end gap-3"
            >
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || isFetching}
                onClick={() => setSearchState((previous) => ({ ...previous, page: page - 1 }))}
              >
                Inscriptions précédentes
              </Button>
              <span className="text-xs text-muted-foreground">
                Page {page} sur {Math.max(page, pages)}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= pages || isFetching}
                onClick={() => setSearchState((previous) => ({ ...previous, page: page + 1 }))}
              >
                Inscriptions suivantes
              </Button>
            </nav>
          )}
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
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar size="lg" aria-hidden="true" className="shrink-0">
                    <AvatarFallback className="bg-(--color-primary) text-xs text-primary-foreground">
                      {getInitials(student.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 space-y-1">
                    <h2 id={`${detailId}-title`} className="text-base font-semibold">
                      {student.name}
                    </h2>
                    <p className="break-all text-xs text-muted-foreground">
                      {student.email ?? 'E-mail indisponible'}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <StudentContactButton email={student.email} />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={collapse}
                  >
                    <PanelRightClose aria-hidden="true" className="size-3.5" />
                    Replier
                  </Button>
                </div>
              </div>
              <StudentAttemptHistory key={student.id} enrollmentId={student.id} />
            </section>
          )}
        </div>
      </div>
    </SheetContent>
  );
}
