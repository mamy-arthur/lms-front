'use client';

import type { ComponentType, CSSProperties } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Mail, MapPin, Pencil } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { User } from '@/shared/types/user.types';
import { ACCESS } from '@/shared/auth/permissions';
import type { Role } from '@/shared/constants/roles';
import { useUserQueryScope } from '@/shared/hooks/useUserQueryScope';
import { normalizeUser } from '@/shared/lib/normalizeUser';
import { getInitials } from '@/shared/lib/string/getInitials';
import type { UserDetailArea } from '@/shared/types/user-detail.types';
import { formatShortDate } from '../../lib/studentProgressFormatters';
import { UserActiveBadge, UserRoleBadge } from './index';
import type { UserDetailPageProps } from './UserDetailDrawer';

interface Props extends UserDetailPageProps {
  namespace: string;
  role: Role;
  labels: { title: string; profile: string; missing: string; unavailable: string; edit: string };
  loadProfile: (area: UserDetailArea, id: string, signal?: AbortSignal) => Promise<{ data: User }>;
  content: ComponentType<Pick<UserDetailPageProps, 'id' | 'area'>>;
}

export function errorStatus(error: unknown) {
  return error && typeof error === 'object' && 'status' in error ? error.status : undefined;
}

export function retryRequest(count: number, error: unknown) {
  return ![401, 403, 404, 422].includes(Number(errorStatus(error))) && count < 1;
}

export function UserDetailPage(props: Props) {
  const scope = useUserQueryScope(props.namespace, ACCESS.users.anyRoles);
  if (!scope.enabled) return <p role="alert">Vous n’avez pas accès à cette page.</p>;
  return <DetailContent key={JSON.stringify([...scope.key, props.area, props.id])} {...props} />;
}

function DetailContent({
  id,
  area,
  onEdit,
  namespace,
  role,
  labels,
  loadProfile,
  content: Content,
}: Props) {
  const scope = useUserQueryScope(namespace, ACCESS.users.anyRoles);
  const profile = useQuery({
    queryKey: [...scope.key, area, id, 'profile'],
    queryFn: async ({ signal }) => {
      const { data } = await loadProfile(area, id, signal);
      if (!data) throw new Error('Missing profile');
      // Validate the raw role before normalization can supply a default.
      if (data.role !== role) throw Object.assign(new Error('Unexpected role'), { status: 404 });
      return normalizeUser(data);
    },
    enabled: scope.enabled,
    retry: retryRequest,
    placeholderData: () => undefined,
    refetchOnMount: 'always',
  });
  const validRole = profile.data?.role === role;
  const notFound = errorStatus(profile.error) === 404 || (profile.isSuccess && !validRole);

  return (
    <div
      className="@container/trainee min-w-0 space-y-6 bg-background text-foreground"
      style={{ '--trainee-accent': 'var(--primary-color, var(--color-primary))' } as CSSProperties}
    >
      {profile.isPending || (!profile.isFetchedAfterMount && !profile.isError) ? (
        <section aria-busy="true" aria-label={labels.profile} className="rounded-2xl border p-6">
          <h1 className="sr-only">{labels.title}</h1>
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
          <h1 className="text-xl font-semibold">{labels.missing}</h1>
          <p className="mt-2 text-muted-foreground">
            Ce profil n’existe pas ou n’est plus accessible.
          </p>
        </section>
      ) : profile.isError ? (
        <section className="rounded-2xl border p-8">
          <h1 className="mb-3 text-xl font-semibold">{labels.title}</h1>
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
      ) : profile.data && validRole ? (
        <>
          <UserProfile user={profile.data} onEdit={() => onEdit(profile.data)} labels={labels} />
          <Content id={id} area={area} />
        </>
      ) : null}
    </div>
  );
}

function ProfileDate({ value }: { value: string | null }) {
  if (!value || Number.isNaN(new Date(value).getTime())) return <>—</>;
  return <time dateTime={value}>{formatShortDate(value)}</time>;
}

function UserProfile({
  user,
  onEdit,
  labels,
}: {
  user: User;
  onEdit: () => void;
  labels: Props['labels'];
}) {
  const name = user.full_name || labels.unavailable;
  const location = [user.zip_code, user.city, user.country].filter(Boolean).join(' ');
  const details = [
    { label: 'Adresse', value: user.address || 'Non renseignée' },
    { label: 'Localisation', value: location || 'Non renseignée' },
    { label: 'Langue préférée', value: user.preferred_language || 'Non renseignée' },
    { label: 'Fuseau horaire', value: user.timezone || 'Non renseigné' },
  ];
  return (
    <section
      aria-label={labels.profile}
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
                <ProfileDate value={user.created_at} />
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Dernière modification</dt>
              <dd className="mt-1 text-xs">
                <ProfileDate value={user.updated_at} />
              </dd>
            </div>
          </dl>
          <Button
            variant="outline"
            onClick={onEdit}
            className="justify-self-start gap-2 text-xs text-[var(--trainee-accent)] @md/trainee:col-start-2 @md/trainee:row-start-1 @md/trainee:justify-self-end"
          >
            <Pencil className="size-3" aria-hidden="true" />
            {labels.edit}
          </Button>
        </div>
      </div>
    </section>
  );
}

export function QueryError({
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
