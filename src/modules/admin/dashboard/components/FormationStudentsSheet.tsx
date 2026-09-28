'use client';

import { useId, useRef, useState } from 'react';
import { CalendarClock, ChevronRight, Clock, Mail, PanelRightClose, Search } from 'lucide-react';
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
import { getInitials } from '@/shared/lib/string/getInitials';
import { normalizeSearch } from '@/shared/lib/string/normalizeSearch';
import {
  formatAttemptDate,
  formatAttemptDuration,
  formatShortDate,
  getDemoEnrollmentSummary,
  getDemoStudentAttempts,
  type EnrollmentSummaryDemo,
} from '../data/studentAttemptsDemo';
import {
  DateRangeColumnFilter,
  EMPTY_DATE_RANGE,
  isDateRangeActive,
  matchesDateRange,
  type DateRange,
} from './DateRangeColumnFilter';
import {
  getDemoFormationRoster,
  type DashboardEnrollmentStatus,
  type FormationProgressDemo,
} from '../data/studentProgressDemo';
import { StudentAttemptHistory } from './StudentAttemptHistory';

export type FormationStudentSelection = {
  formation: FormationProgressDemo;
  /** Filtre de statut initial. `null` ouvre le panneau sur tout l'effectif. */
  status: DashboardEnrollmentStatus | null;
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

/**
 * Colonnes filtrables par plage de dates, dans leur ordre d'affichage. La clé
 * est le champ de `EnrollmentSummaryDemo` sur lequel la plage est comparée.
 */
const DATE_COLUMNS = [
  { key: 'startedAt', label: 'Début' },
  { key: 'endedAt', label: 'Fin' },
  { key: 'accessEndsAt', label: 'Accès valable jusqu’au' },
] as const satisfies readonly { key: keyof EnrollmentSummaryDemo; label: string }[];

type DateColumnKey = (typeof DATE_COLUMNS)[number]['key'];

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
  const [dateFilters, setDateFilters] = useState<Record<DateColumnKey, DateRange>>({
    startedAt: EMPTY_DATE_RANGE,
    endedAt: EMPTY_DATE_RANGE,
    accessEndsAt: EMPTY_DATE_RANGE,
  });
  const detailId = useId();
  const rowButtons = useRef(new Map<string, HTMLButtonElement>());

  const countByStatus = (value: DashboardEnrollmentStatus) =>
    students.filter((item) => item.status === value).length;

  // La synthèse est calculée avant le filtrage : les plages de dates portent sur
  // ses champs, et la calculer deux fois par ligne n'aurait aucun intérêt.
  const rows = students.map((item) => ({
    student: item,
    summary: selection ? getDemoEnrollmentSummary(selection.formation, item.status, item.id) : null,
  }));

  const query = normalizeSearch(search);
  const visibleRows = rows.filter(({ student: item, summary }) => {
    if (statusFilter && item.status !== statusFilter) return false;
    if (
      query &&
      !normalizeSearch(item.name).includes(query) &&
      !normalizeSearch(item.email).includes(query)
    ) {
      return false;
    }
    // Les plages de plusieurs colonnes se cumulent.
    return DATE_COLUMNS.every(({ key }) => matchesDateRange(summary?.[key], dateFilters[key]));
  });

  const activeDateFilters = DATE_COLUMNS.filter(({ key }) =>
    isDateRangeActive(dateFilters[key]),
  ).length;
  const isFiltered = Boolean(query) || statusFilter !== null || activeDateFilters > 0;

  const resetFilters = () => {
    setSearch('');
    setStatusFilter(null);
    setDateFilters({
      startedAt: EMPTY_DATE_RANGE,
      endedAt: EMPTY_DATE_RANGE,
      accessEndsAt: EMPTY_DATE_RANGE,
    });
  };

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
              <Alert
                role={undefined}
                className="w-auto border bg-amber-50 border-amber-100 text-amber-600 rounded-sm"
              >
                <Clock aria-hidden="true" />
                <AlertTitle>Durée théorique</AlertTitle>
                <AlertDescription className="tabular-nums text-amber-600">
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
              <div className="flex items-center gap-3">
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
                    className={cn(
                      'h-8 pl-8 transition-[width] duration-300 motion-reduce:transition-none',
                      // Le volet de détail réduit la colonne de moitié : à 25rem
                      // le champ y écraserait les badges de statut.
                      student ? 'w-72' : 'w-100',
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
                  {isFiltered
                    ? `${visibleRows.length} sur ${students.length} étudiant${students.length > 1 ? 's' : ''}`
                    : `${students.length} étudiant${students.length > 1 ? 's' : ''}`}
                </p>
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
                  className="rounded-sm  px-2 py-1 text-xs transition-colors hover:bg-muted aria-pressed:border-(--color-primary) aria-pressed:bg-(--color-primary)/10"
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
                      'rounded-sm  px-2 text-xs transition-colors hover:brightness-95 aria-pressed:ring-1 aria-pressed:ring-current',
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
                {DATE_COLUMNS.slice(0, 2).map(({ key, label }) => (
                  <th key={key} scope="col" className="px-3 pb-1 text-left font-medium">
                    <span className="inline-flex items-center gap-1">
                      {label}
                      <DateRangeColumnFilter
                        label={label}
                        range={dateFilters[key]}
                        onApply={(range) => setDateFilters((prev) => ({ ...prev, [key]: range }))}
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
                      onApply={(range) =>
                        setDateFilters((prev) => ({ ...prev, accessEndsAt: range }))
                      }
                    />
                  </span>
                </th>
                <th scope="col" className="px-3 pb-1 text-left font-medium">
                  Statut
                </th>
                {/* Colonne du chevron : sans intitulé visible, mais nommée pour
                    ne pas laisser un en-tête vide aux lecteurs d'écran. */}
                <th scope="col" className="w-8 pb-1">
                  <span className="sr-only">Détails</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="space-y-2 rounded-sm border border-dashed px-3 py-8 text-center"
                  >
                    <p className="text-sm font-medium">
                      {students.length === 0
                        ? 'Aucun étudiant inscrit à cette formation.'
                        : 'Aucun étudiant ne correspond aux filtres.'}
                    </p>
                    {/* Un seul bouton : la recherche seule ne suffirait plus à
                        débloquer une liste vidée par une plage de dates. Rien à
                        réinitialiser si la formation n'a aucun inscrit. */}
                    {students.length > 0 && isFiltered && (
                      <Button type="button" variant="outline" onClick={resetFilters}>
                        Réinitialiser les filtres
                      </Button>
                    )}
                  </td>
                </tr>
              )}
              {visibleRows.map(({ student: item, summary }) => {
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
                    <p className="break-all text-xs text-muted-foreground">{student.email}</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {/*
                    Un `mailto:` plutôt qu'un faux bouton : il n'y a pas
                    d'endpoint de messagerie, et ça ouvre réellement le client
                    mail du responsable avec la bonne adresse.
                  */}
                  <Button asChild variant="outline" size="sm" className="h-7 px-2 text-xs">
                    <a href={`mailto:${student.email}`}>
                      <Mail aria-hidden="true" className="size-3.5" />
                      Contacter l’étudiant
                    </a>
                  </Button>
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
              <StudentAttemptHistory key={student.id} attempts={attempts} />
            </section>
          )}
        </div>
      </div>
    </SheetContent>
  );
}
