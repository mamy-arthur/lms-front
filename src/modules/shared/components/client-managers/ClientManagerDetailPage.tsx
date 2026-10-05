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
import { clientManagerDetailApi } from '@/shared/api/client-manager-detail.api';
import { ACCESS } from '@/shared/auth/permissions';
import { Role } from '@/shared/constants/roles';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { useUserQueryScope } from '@/shared/hooks/useUserQueryScope';
import type { ClientManagerPurchasesParams } from '@/shared/types/client-manager-detail.types';
import type { UserDetailPageProps } from '../users/UserDetailDrawer';
import { UserDetailPage, QueryError, errorStatus, retryRequest } from '../users/UserDetailPage';
import { ClientManagerPurchaseCard } from './ClientManagerPurchaseCard';

export function ClientManagerDetailPage(props: UserDetailPageProps) {
  return (
    <UserDetailPage
      {...props}
      namespace="client-manager-detail"
      role={Role.CLIENT_MANAGER}
      labels={{
        title: 'Détail du responsable',
        profile: 'Profil du responsable',
        missing: 'Responsable introuvable',
        unavailable: 'Responsable indisponible',
        edit: 'Modifier le responsable',
      }}
      loadProfile={clientManagerDetailApi.profile}
      content={ClientManagerPurchases}
    />
  );
}

function ClientManagerPurchases({ id, area }: Pick<UserDetailPageProps, 'id' | 'area'>) {
  const scope = useUserQueryScope('client-manager-detail', ACCESS.users.anyRoles);
  const [filters, setFilters] = useState({ search: '', page: 1, sort: 'recent' });
  const debouncedSearch = useDebounce(filters.search);
  const page = filters.search === debouncedSearch ? filters.page : 1;
  const params: ClientManagerPurchasesParams = {
    page,
    per_page: 20,
    q: debouncedSearch.trim(),
    sort_by: filters.sort === 'name' ? 'name' : 'created_at',
    sort_dir: filters.sort === 'name' ? 'asc' : 'desc',
  };
  const query = useQuery({
    queryKey: [...scope.key, area, id, 'purchases', params],
    queryFn: ({ signal }) => clientManagerDetailApi.purchases(area, id, params, signal),
    enabled: scope.enabled,
    retry: retryRequest,
    placeholderData: () => undefined,
    refetchOnMount: 'always',
  });
  const busy = query.isFetching || debouncedSearch !== filters.search;
  const meta = query.data?.meta;
  const pages = Math.max(1, Math.ceil((meta?.total ?? 0) / (meta?.per_page ?? 20)));
  const filtered = Boolean(debouncedSearch.trim());

  return (
    <section
      aria-labelledby="manager-formations-title"
      className="space-y-5 rounded-sm border bg-background p-4 sm:p-6"
    >
      <div>
        <h2 id="manager-formations-title" className="text-lg font-semibold">
          Formations achetées
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Les formations achetées du responsable dans votre périmètre.
        </p>
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
              if (value === 'recent' || value === 'name')
                setFilters((previous) => ({ ...previous, sort: value, page: 1 }));
            }}
          >
            <SelectTrigger aria-label="Trier par" className="w-52 text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Achat le plus récent</SelectItem>
              <SelectItem value="name">Nom de formation</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div aria-busy={busy} aria-label="Achats du responsable">
        {busy || query.isPending ? (
          <div className="space-y-3">
            <p role="status" className="text-sm text-muted-foreground">
              Chargement des formations…
            </p>
            {[0, 1, 2].map((item) => (
              <Skeleton key={item} className="h-36 w-full rounded-xl" />
            ))}
          </div>
        ) : query.isError ? (
          <QueryError
            message={
              errorStatus(query.error) === 404
                ? 'Les formations de ce responsable ne sont plus accessibles.'
                : errorStatus(query.error) === 403
                  ? 'Vous n’avez pas accès à ces formations.'
                  : 'Impossible de charger les formations.'
            }
            retry={() => void query.refetch()}
            label="Réessayer les formations"
            forbidden={[403, 404].includes(Number(errorStatus(query.error)))}
          />
        ) : query.data?.data.length ? (
          <ul className="space-y-3" aria-label="Formations du responsable">
            {query.data.data.map((purchase) => (
              <ClientManagerPurchaseCard key={purchase.id} purchase={purchase} />
            ))}
          </ul>
        ) : (
          <div className="py-12 text-center text-sm text-muted-foreground">
            <p>
              {page > 1
                ? 'Aucun achat sur cette page.'
                : filtered
                  ? 'Aucune formation ne correspond à la recherche.'
                  : 'Aucune formation achetée.'}
            </p>
            {(filtered || page > 1) && (
              <Button
                variant="ghost"
                onClick={() => setFilters({ search: '', page: 1, sort: 'recent' })}
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
            ? `${meta.total} achat${meta.total === 1 ? '' : 's'} · Page ${meta.page} sur ${pages}`
            : 'Pagination des achats'}
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
