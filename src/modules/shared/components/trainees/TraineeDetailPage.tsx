'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { traineeDetailApi } from '@/shared/api/trainee-detail.api';
import { ACCESS } from '@/shared/auth/permissions';
import { Role } from '@/shared/constants/roles';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { useUserQueryScope } from '@/shared/hooks/useUserQueryScope';
import type { EnrollmentStatus } from '@/shared/types/enrollment.types';
import type { UserDetailPageProps as Props } from '../users/UserDetailDrawer';
import { UserDetailPage, QueryError, errorStatus, retryRequest } from '../users/UserDetailPage';
import { TRAINEE_STATUSES, TraineeEnrollmentCard } from './TraineeEnrollmentCard';

export function TraineeDetailPage(props: Props) {
  return (
    <UserDetailPage
      {...props}
      namespace="trainee-detail"
      role={Role.TRAINEE}
      labels={{
        title: 'Détail du stagiaire',
        profile: 'Profil du stagiaire',
        missing: 'Stagiaire introuvable',
        unavailable: 'Stagiaire indisponible',
        edit: 'Modifier le stagiaire',
      }}
      loadProfile={traineeDetailApi.profile}
      content={TraineeEnrollments}
    />
  );
}

function TraineeEnrollments({ id, area }: Pick<Props, 'id' | 'area'>) {
  const scope = useUserQueryScope('trainee-detail', ACCESS.users.anyRoles);
  const [filters, setFilters] = useState({
    search: '',
    status: '' as EnrollmentStatus | '',
    page: 1,
    sort: 'recent',
  });
  const debouncedSearch = useDebounce(filters.search);
  const page = filters.search === debouncedSearch ? filters.page : 1;
  const params = {
    page,
    per_page: 20,
    q: debouncedSearch.trim(),
    status: filters.status || undefined,
    sort_by: filters.sort === 'title' ? ('title' as const) : ('enrolled_at' as const),
    sort_dir: filters.sort === 'title' ? ('asc' as const) : ('desc' as const),
  };
  const query = useQuery({
    queryKey: [...scope.key, area, id, 'enrollments', params],
    queryFn: ({ signal }) => traineeDetailApi.enrollments(area, id, params, signal),
    enabled: scope.enabled,
    retry: retryRequest,
    placeholderData: () => undefined,
    refetchOnMount: 'always',
  });
  const busy = query.isFetching || debouncedSearch !== filters.search;
  const meta = query.data?.meta;
  const pages = Math.max(1, Math.ceil((meta?.total ?? 0) / (meta?.per_page ?? 20)));
  const filtered = Boolean(filters.status || debouncedSearch.trim());
  const statuses: { value: EnrollmentStatus | ''; label: string }[] = [
    { value: '', label: 'Toutes' },
    { value: 'in_progress', label: 'En cours' },
    { value: 'completed', label: 'Terminées' },
    { value: 'not_started', label: 'Non commencées' },
    { value: 'failed', label: 'Échouées' },
    { value: 'expired', label: 'Expirées' },
  ];
  return (
    <section
      aria-labelledby="trainee-formations-title"
      className="space-y-5 rounded-sm border bg-background p-4 sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex gap-3">
          <div>
            <h2 id="trainee-formations-title" className="text-lg font-semibold">
              Formations
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Les inscriptions du stagiaire dans votre périmètre.
            </p>
          </div>
        </div>
        <div
          role="group"
          aria-label="Filtrer les formations par statut"
          className="flex flex-wrap gap-1.5"
        >
          {statuses.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              aria-pressed={filters.status === value}
              onClick={() => setFilters((previous) => ({ ...previous, status: value, page: 1 }))}
              className={cn(
                'rounded-sm px-2 py-1 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                value
                  ? [
                      'hover:brightness-95 aria-pressed:ring-1 aria-pressed:ring-current',
                      TRAINEE_STATUSES[value].className,
                    ]
                  : 'hover:bg-muted aria-pressed:bg-(--color-primary)/10',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-3 @xl/trainee:flex-row @xl/trainee:items-center @xl/trainee:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            aria-label="Rechercher une formation"
            placeholder="Rechercher une formation…"
            value={filters.search}
            onChange={(event) =>
              setFilters((previous) => ({ ...previous, search: event.target.value, page: 1 }))
            }
            className="pl-9"
          />
        </div>
        <div className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
          <Select
            value={filters.sort}
            onValueChange={(value) => {
              if (value === 'recent' || value === 'title')
                setFilters((previous) => ({ ...previous, sort: value, page: 1 }));
            }}
          >
            <SelectTrigger aria-label="Trier par" className="w-52 text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Inscription la plus récente</SelectItem>
              <SelectItem value="title">Nom de formation</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div aria-busy={busy} aria-label="Inscriptions du stagiaire">
        {busy || query.isPending ? (
          <div className="space-y-3">
            <p role="status" className="text-sm text-muted-foreground">
              Chargement des inscriptions…
            </p>
            {[0, 1, 2].map((item) => (
              <Skeleton key={item} className="h-36 w-full rounded-xl" />
            ))}
          </div>
        ) : query.isError ? (
          <QueryError
            message={
              errorStatus(query.error) === 404
                ? 'Les inscriptions de ce stagiaire ne sont plus accessibles.'
                : errorStatus(query.error) === 403
                  ? 'Vous n’avez pas accès à ces inscriptions.'
                  : 'Impossible de charger les inscriptions.'
            }
            retry={() => void query.refetch()}
            label="Réessayer les inscriptions"
            forbidden={[403, 404].includes(Number(errorStatus(query.error)))}
          />
        ) : query.data?.data.length ? (
          <ul className="space-y-3" aria-label="Formations du stagiaire">
            {query.data.data.map((enrollment) => (
              <TraineeEnrollmentCard key={enrollment.id} enrollment={enrollment} />
            ))}
          </ul>
        ) : (
          <div className="py-12 text-center text-sm text-muted-foreground">
            <p>
              {page > 1
                ? 'Aucune inscription sur cette page.'
                : filtered
                  ? 'Aucune formation ne correspond aux filtres.'
                  : 'Aucune inscription.'}
            </p>
            {(filtered || page > 1) && (
              <Button
                variant="ghost"
                onClick={() => setFilters({ search: '', status: '', page: 1, sort: 'recent' })}
                className="mt-3"
              >
                Réinitialiser les filtres
              </Button>
            )}
          </div>
        )}
      </div>
      <nav
        aria-label="Pagination des formations"
        className="flex flex-wrap items-center justify-between gap-3 border-t pt-4 text-xs text-muted-foreground"
      >
        <span>
          {!busy && !query.isError && meta
            ? `${meta.total} inscription${meta.total === 1 ? '' : 's'} · Page ${meta.page} sur ${pages}`
            : 'Pagination des inscriptions'}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={busy || page <= 1}
            onClick={() => setFilters((previous) => ({ ...previous, page: page - 1 }))}
          >
            Précédent
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={busy || query.isError || page >= pages}
            onClick={() => setFilters((previous) => ({ ...previous, page: page + 1 }))}
          >
            Suivant
          </Button>
        </div>
      </nav>
    </section>
  );
}
