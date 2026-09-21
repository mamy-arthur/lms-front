'use client';

import { useRef, useState } from 'react';
import { GraduationCap, Search, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  enrollmentStatuses,
  formationProgressDemo,
  getCompletionRate,
  getEnrollmentCount,
  type FormationProgressDemo,
} from '../data/studentProgressDemo';
import { FormationStudentsSheet, type FormationStudentSelection } from './FormationStudentsSheet';
import { AverageProgressIndicator } from './AverageProgressIndicator';

function normalizeSearch(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('fr-FR')
    .trim();
}

export function FormationProgressCards({
  formations = formationProgressDemo,
}: {
  formations?: FormationProgressDemo[];
}) {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('enrolled');
  const [selection, setSelection] = useState<FormationStudentSelection | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const visibleFormations = formations
    .filter((formation) => normalizeSearch(formation.name).includes(normalizeSearch(search)))
    .sort((a, b) => {
      const difference =
        sort === 'completion'
          ? getCompletionRate(a) - getCompletionRate(b)
          : sort === 'failed'
            ? b.failed - a.failed
            : getEnrollmentCount(b) - getEnrollmentCount(a);
      return difference || a.name.localeCompare(b.name, 'fr');
    });

  return (
    <section aria-labelledby="formation-progress-title" className="space-y-3">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h2 id="formation-progress-title" className="text-base font-semibold">
            Suivi des étudiants par formation
          </h2>
          <p className="text-xs text-muted-foreground">
            Consultez les effectifs par statut et ouvrez un badge pour voir les étudiants.
          </p>
        </div>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-sm">
          <Search
            className="pointer-events-none absolute top-2 left-2.5 size-4 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            aria-label="Rechercher une formation"
            placeholder="Rechercher une formation…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-8 pl-8"
          />
        </div>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger aria-label="Trier les formations" className="h-8 w-full sm:w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="enrolled">Plus d’inscrits</SelectItem>
            <SelectItem value="completion">Moins de complétion</SelectItem>
            <SelectItem value="failed">Plus d’échecs</SelectItem>
          </SelectContent>
        </Select>
        <p role="status" aria-live="polite" className="text-xs text-muted-foreground sm:ml-auto">
          {visibleFormations.length} sur {formations.length} formations
        </p>
      </div>

      {visibleFormations.length === 0 && (
        <div className="space-y-2 rounded-sm border border-dashed p-6 text-center">
          <p className="text-sm font-medium">
            {formations.length
              ? 'Aucune formation ne correspond à votre recherche.'
              : 'Aucune formation à afficher.'}
          </p>
          {search && (
            <Button variant="outline" onClick={() => setSearch('')}>
              Effacer la recherche
            </Button>
          )}
        </div>
      )}

      <ul className="space-y-2">
        {visibleFormations.map((formation) => {
          const enrolled = getEnrollmentCount(formation);
          const progress = Math.round(getCompletionRate(formation));

          return (
            <li
              key={formation.id}
              className="space-y-4 rounded-sm border bg-card p-4 text-card-foreground"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="shrink-0 rounded-sm bg-muted p-2 text-muted-foreground">
                    <GraduationCap className="size-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 space-y-1">
                    <h3 className="wrap-break-word text-sm font-semibold">{formation.name}</h3>
                    <dl>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="size-3" aria-hidden="true" />
                        <dt className="order-2">inscrits</dt>
                        <dd className="tabular-nums">{enrolled}</dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </div>

              <div className="grid items-center gap-3 lg:grid-cols-2 lg:gap-6">
                <div className="space-y-2">
                  <AverageProgressIndicator
                    value={progress}
                    variant="completion"
                    ariaLabel={`Taux de complétion de ${formation.name}`}
                  />
                </div>
                <div className="flex flex-wrap gap-2 lg:justify-end">
                  {enrollmentStatuses.map((status) => (
                    <Badge
                      key={status.key}
                      asChild
                      variant="outline"
                      className={`${status.badgeClassName} h-6 cursor-pointer hover:brightness-95 disabled:cursor-default disabled:opacity-50`}
                    >
                      <button
                        type="button"
                        disabled={formation[status.key] === 0}
                        aria-haspopup="dialog"
                        aria-label={`${status.label} : ${formation[status.key]} — ${formation.name}`}
                        onClick={(event) => {
                          triggerRef.current = event.currentTarget;
                          setSelection({ formation, status: status.key });
                        }}
                      >
                        <span className="size-1 rounded-full bg-current" aria-hidden="true" />
                        <span className="font-semibold tabular-nums">{formation[status.key]}</span>
                        {status.badgeLabel}
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="text-xs text-muted-foreground">
        Taux de complétion : part des inscrits ayant terminé avec succès, distincte de la
        progression moyenne.
      </p>
      <FormationStudentsSheet
        selection={selection}
        onClose={() => setSelection(null)}
        onRestoreFocus={() => triggerRef.current?.focus()}
      />
    </section>
  );
}
