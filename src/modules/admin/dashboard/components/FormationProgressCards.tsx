'use client';

import { GraduationCap, Search, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import type { DashboardFormationSort } from '@/shared/types/dashboard.types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { dashboardEnrollmentStatuses } from '../data/enrollmentStatuses';
import type { DashboardFormation } from '../types';
import { AverageProgressIndicator } from './AverageProgressIndicator';

interface FormationProgressCardsProps {
  formations: DashboardFormation[];
  total: number;
  page: number;
  perPage: number;
  search: string;
  sort: DashboardFormationSort;
  onSearchChange: (value: string) => void;
  onSortChange: (value: DashboardFormationSort) => void;
  onPageChange: (page: number) => void;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  onRetry: () => void;
}

export function FormationProgressCards({
  formations,
  total,
  page,
  perPage,
  search,
  sort,
  onSearchChange,
  onSortChange,
  onPageChange,
  isLoading,
  isFetching,
  isError,
  onRetry,
}: FormationProgressCardsProps) {
  const pages = Math.max(1, Math.ceil(total / perPage));
  // Le serveur peut renvoyer moins de pages que demandé si le catalogue a rétréci entre-temps.
  const currentPage = Math.min(Math.max(page, 1), pages);

  return (
    <section aria-labelledby="formation-progress-title" className="space-y-3">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h2 id="formation-progress-title" className="text-base font-semibold">
            Suivi des étudiants par formation
          </h2>
          <p className="text-xs text-muted-foreground">
            Toutes les inscriptions par statut, réinscriptions incluses.
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
            onChange={(event) => onSearchChange(event.target.value)}
            className="h-8 pl-8"
          />
        </div>
        <Select
          value={sort}
          onValueChange={(value) => {
            if (value === 'enrolled' || value === 'completion' || value === 'failed')
              onSortChange(value);
          }}
        >
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
          {isFetching
            ? 'Chargement des formations…'
            : isError
              ? 'Formations indisponibles'
              : `${formations.length} sur ${total} formations`}
        </p>
      </div>

      {isError ? (
        <div role="alert" className="space-y-3 rounded-sm border p-5">
          <p className="text-sm">Impossible de charger les formations.</p>
          <Button variant="outline" onClick={onRetry} disabled={isFetching}>
            {isFetching ? 'Nouvelle tentative…' : 'Réessayer les formations'}
          </Button>
        </div>
      ) : isLoading ? (
        <div aria-label="Chargement des formations" aria-busy="true" className="space-y-2">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-36 w-full" />
          ))}
        </div>
      ) : formations.length === 0 ? (
        <div className="space-y-2 rounded-sm border border-dashed p-6 text-center">
          <p className="text-sm font-medium">
            {search.trim()
              ? 'Aucune formation ne correspond à votre recherche.'
              : 'Aucune formation à afficher.'}
          </p>
          {search && (
            <Button variant="outline" onClick={() => onSearchChange('')}>
              Effacer la recherche
            </Button>
          )}
        </div>
      ) : (
        <ul className="space-y-2" aria-busy={isFetching}>
          {formations.map((formation) => {
            const enrolled = formation.totalEnrollments;
            const progress = Math.round(formation.completionRate);

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
                          <dt className="order-2">inscriptions</dt>
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
                    {dashboardEnrollmentStatuses.map((status) => (
                      <Badge
                        key={status.key}
                        variant="outline"
                        role="img"
                        className={`${status.badgeClassName} h-6`}
                        aria-label={`${status.label} : ${formation.statusCounts[status.key]} — ${formation.name}`}
                      >
                        <span className="size-1 rounded-full bg-current" aria-hidden="true" />
                        <span className="font-semibold tabular-nums">
                          {formation.statusCounts[status.key]}
                        </span>
                        {status.badgeLabel}
                      </Badge>
                    ))}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {!isLoading && !isError && (pages > 1 || currentPage > 1) && (
        <nav aria-label="Pagination des formations" className="flex items-center justify-end gap-3">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1 || isFetching}
            onClick={() => onPageChange(currentPage - 1)}
          >
            Précédent
          </Button>
          <span className="text-xs text-muted-foreground">
            Page {currentPage} sur {pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= pages || isFetching}
            onClick={() => onPageChange(currentPage + 1)}
          >
            Suivant
          </Button>
        </nav>
      )}
      <p className="text-xs text-muted-foreground">
        Taux de complétion : part des inscriptions terminées avec succès, distincte de la
        progression moyenne.
      </p>
    </section>
  );
}
