'use client';

import { useState, type CSSProperties } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Mail, MapPin, Pencil, Search } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { normalizeUser, type User } from '@/modules/admin/resources/users/types';
import { traineeDetailApi } from '@/shared/api/trainee-detail.api';
import { ACCESS } from '@/shared/auth/permissions';
import { Role } from '@/shared/constants/roles';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { useUserQueryScope } from '@/shared/hooks/useUserQueryScope';
import { getInitials } from '@/shared/lib/string/getInitials';
import type { EnrollmentStatus } from '@/shared/types/enrollment.types';
import type { TraineeDetailArea } from '@/shared/types/trainee-detail.types';
import { UserActiveBadge, UserRoleBadge } from '../users';
import { TRAINEE_STATUSES, TraineeDate, TraineeEnrollmentCard } from './TraineeEnrollmentCard';

interface Props {
  id: string;
  area: TraineeDetailArea;
  onEdit: (user: User) => void;
}

function errorStatus(error: unknown) {
  return error && typeof error === 'object' && 'status' in error ? error.status : undefined;
}

function retryRequest(count: number, error: unknown) {
  return ![401, 403, 404, 422].includes(Number(errorStatus(error))) && count < 1;
}

export function TraineeDetailPage(props: Props) {
  const scope = useUserQueryScope('trainee-detail', ACCESS.users.anyRoles);
  if (!scope.enabled) return <p role="alert">Vous n’avez pas accès à cette page.</p>;
  return (
    <TraineeDetailContent key={JSON.stringify([...scope.key, props.area, props.id])} {...props} />
  );
}

function TraineeDetailContent({ id, area, onEdit }: Props) {
  const scope = useUserQueryScope('trainee-detail', ACCESS.users.anyRoles);
  const profileKey = [...scope.key, area, id, 'profile'];
  const profile = useQuery({
    queryKey: profileKey,
    queryFn: async ({ signal }) => {
      const { data } = await traineeDetailApi.profile(area, id, signal);
      if (!data) throw new Error('Missing profile');
      if (data.role !== Role.TRAINEE)
        throw Object.assign(new Error('Not a trainee'), { status: 404 });
      return normalizeUser(data);
    },
    enabled: scope.enabled,
    retry: retryRequest,
    placeholderData: () => undefined,
    refetchOnMount: 'always',
  });
  const isTrainee = profile.data?.role === Role.TRAINEE;
  const notFound = errorStatus(profile.error) === 404 || (profile.isSuccess && !isTrainee);

  return (
    <div
      className="@container/trainee min-w-0 space-y-6 bg-background text-foreground"
      style={{ '--trainee-accent': 'var(--primary-color, var(--color-primary))' } as CSSProperties}
    >
      {profile.isPending || (!profile.isFetchedAfterMount && !profile.isError) ? (
        <section
          aria-busy="true"
          aria-label="Profil du stagiaire"
          className="rounded-2xl border p-6"
        >
          <h1 className="sr-only">Détail du stagiaire</h1>
          <p role="status" className="mb-4 text-sm text-muted-foreground">
            Chargement du profil…
          </p>
          <div className="flex gap-6">
            <Skeleton className="size-28 rounded-full" />
            <Skeleton className="h-28 flex-1" />
          </div>
        </section>
      ) : notFound ? (
        <section className="rounded-2xl border p-8">
          <h1 className="text-xl font-semibold">Stagiaire introuvable</h1>
          <p className="mt-2 text-muted-foreground">
            Ce profil n’existe pas ou n’est plus accessible.
          </p>
        </section>
      ) : profile.isError ? (
        <section className="rounded-2xl border p-8">
          <h1 className="mb-3 text-xl font-semibold">Détail du stagiaire</h1>
          <QueryError
            message={
              errorStatus(profile.error) === 403
                ? 'Vous n’avez pas accès à ce profil.'
                : 'Impossible de charger le profil.'
            }
            retry={() => void profile.refetch()}
            label="Réessayer le profil"
            forbidden={errorStatus(profile.error) === 403}
          />
        </section>
      ) : profile.data && isTrainee ? (
        <>
          <TraineeProfile user={profile.data} onEdit={() => onEdit(profile.data)} />
          <TraineeEnrollments id={id} area={area} />
        </>
      ) : null}
    </div>
  );
}

function TraineeProfile({ user, onEdit }: { user: User; onEdit: () => void }) {
  const name = user.full_name || 'Stagiaire indisponible';
  const location = [user.zip_code, user.city, user.country].filter(Boolean).join(' ');
  const details = [
    { label: 'Adresse', value: user.address || 'Non renseignée' },
    { label: 'Localisation', value: location || 'Non renseignée' },
    { label: 'Langue préférée', value: user.preferred_language || 'Non renseignée' },
    { label: 'Fuseau horaire', value: user.timezone || 'Non renseigné' },
  ];
  return (
    <section
      aria-label="Profil du stagiaire"
      className="relative rounded-sm border bg-background p-3 sm:p-5"
    >
      <div className="grid grid-cols-1 gap-8 @4xl/trainee:grid-cols-[minmax(0,1fr)_minmax(0,1.55fr)]">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <Avatar className="size-20 shrink-0 border shadow-sm sm:size-24">
            <AvatarImage src={user.profile_photo?.url} alt="" className="object-cover" />
            <AvatarFallback className="bg-muted text-xl text-[var(--trainee-accent)]">
              {getInitials(name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 space-y-3">
            <h1 className="text-xl font-semibold break-words tracking-tight">{name}</h1>
            <div className="flex flex-wrap gap-2">
              <UserRoleBadge role={user.role} />
              <UserActiveBadge isActive={user.is_active} />
            </div>
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="size-4 shrink-0" aria-hidden="true" />
              {location || 'Localisation non renseignée'}
            </p>
            {user.email ? (
              <a
                href={`mailto:${user.email}`}
                className="inline-flex max-w-full items-center gap-2 text-xs text-[var(--trainee-accent)] hover:underline"
              >
                <Mail className="size-4 shrink-0" aria-hidden="true" />
                <span className="break-all">{user.email}</span>
              </a>
            ) : (
              <p className="text-xs text-muted-foreground">E-mail indisponible</p>
            )}
          </div>
        </div>
        <div className="grid min-w-0 items-start gap-5 border-t pt-6 @md/trainee:grid-cols-[minmax(0,1fr)_auto] @4xl/trainee:border-t-0 @4xl/trainee:border-l @4xl/trainee:pt-0 @4xl/trainee:pl-8">
          <dl className="grid min-w-0 gap-x-6 gap-y-5 @md/trainee:grid-cols-2">
            {details.map(({ label, value }) => (
              <div key={label}>
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="mt-1 text-xs break-words">{value}</dd>
              </div>
            ))}
            <div>
              <dt className="text-xs text-muted-foreground">Compte créé le</dt>
              <dd className="mt-1 text-xs">
                <TraineeDate value={user.created_at} />
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Dernière modification</dt>
              <dd className="mt-1 text-xs">
                <TraineeDate value={user.updated_at} />
              </dd>
            </div>
          </dl>
          <Button
            variant="outline"
            onClick={onEdit}
            className="justify-self-start gap-2 text-xs text-[var(--trainee-accent)] @md/trainee:col-start-2 @md/trainee:row-start-1 @md/trainee:justify-self-end"
          >
            <Pencil className="size-3" aria-hidden="true" />
            Modifier le stagiaire
          </Button>
        </div>
      </div>
    </section>
  );
}

function QueryError({
  message,
  retry,
  label,
  forbidden = false,
}: {
  message: string;
  retry: () => void;
  label: string;
  forbidden?: boolean;
}) {
  return (
    <div role="alert" className="space-y-3">
      <p>{message}</p>
      {!forbidden && (
        <Button variant="outline" onClick={retry}>
          {label}
        </Button>
      )}
    </div>
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
