'use client';

import { useMemo, useState } from 'react';
import { RoleGuard } from '@/modules/auth/guards/RoleGuard';
import { ACCESS } from '@/shared/auth/permissions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useFormationManagementQuery } from '../hooks/useFormationManagementQuery';
import {
  filterEnrollmentsByStat,
  useFormationManagementController,
} from '../hooks/useFormationManagementController';
import type { FormationStatKey, PurchasedFormationRow } from '../types';
import { FormationsTable } from './_components/formations-table';
import { FormationStatsUsersDrawer } from './_components/formation-stats-users-drawer';
import { FormationAssignmentDrawer } from './_components/formation-assignment-drawer';

interface SortState {
  column: 'name';
  direction: 'asc' | 'desc';
}

export function ClientFormationsManagementPage() {
  const [sort, setSort] = useState<SortState>({ column: 'name', direction: 'asc' });
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);

  const [statsDrawer, setStatsDrawer] = useState<{
    formation: PurchasedFormationRow | null;
    stat: FormationStatKey;
  }>({
    formation: null,
    stat: 'cumulative',
  });

  const [assignmentTarget, setAssignmentTarget] = useState<PurchasedFormationRow | null>(null);

  const { data, isLoading } = useFormationManagementQuery();

  const controller = useFormationManagementController({
    formations: data?.formations ?? [],
    users: data?.users ?? [],
    groups: data?.groups ?? [],
  });

  const sortedRows = useMemo(() => {
    const rows = [...controller.formationRows];

    rows.sort((a, b) => {
      const compareResult = a.name.localeCompare(b.name);

      return sort.direction === 'asc' ? compareResult : -compareResult;
    });

    return rows;
  }, [controller.formationRows, sort]);

  const total = sortedRows.length;

  const paginatedRows = useMemo(() => {
    const start = page * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [page, pageSize, sortedRows]);

  const statsUsers = useMemo(() => {
    if (!statsDrawer.formation) {
      return [];
    }

    return filterEnrollmentsByStat(statsDrawer.formation, statsDrawer.stat);
  }, [statsDrawer]);

  const handleSort = (column: string) => {
    if (column !== 'name') {
      return;
    }

    setSort((current) => ({
      column,
      direction: current.column === column && current.direction === 'asc' ? 'desc' : 'asc',
    }));

    setPage(0);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(0);
  };

  return (
    <RoleGuard
      rule={ACCESS.formationsManagement}
      fallback={
        <Card>
          <CardHeader>
            <CardTitle>Acces non autorise</CardTitle>
            <CardDescription>
              Cette fonctionnalite est reservee au profil client manager.
            </CardDescription>
          </CardHeader>
        </Card>
      }
    >
      <div className="bg-background">
        <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Gestion des formations</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Gere uniquement les formations achetees par votre tenant et les assignations des
              utilisateurs.
            </p>
          </div>
        </header>

        {isLoading ? (
          <Card>
            <CardContent className="space-y-2 py-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </CardContent>
          </Card>
        ) : (
          <FormationsTable
            formations={paginatedRows}
            page={page}
            pageSize={pageSize}
            total={total}
            sort={sort}
            onSort={handleSort}
            onPageChange={setPage}
            onPageSizeChange={handlePageSizeChange}
            onStatClick={(formation, stat) => setStatsDrawer({ formation, stat })}
            onAssign={(formation) => setAssignmentTarget(formation)}
          />
        )}
      </div>

      <FormationStatsUsersDrawer
        open={Boolean(statsDrawer.formation)}
        onOpenChange={(open) => {
          if (!open) {
            setStatsDrawer({ formation: null, stat: 'cumulative' });
          }
        }}
        formationName={statsDrawer.formation?.name ?? ''}
        stat={statsDrawer.stat}
        users={statsUsers}
      />

      <FormationAssignmentDrawer
        open={Boolean(assignmentTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setAssignmentTarget(null);
          }
        }}
        formation={assignmentTarget}
        users={controller.users}
        groups={controller.groups}
        onUpdateDuration={controller.updateFormationDuration}
        onAssignUsers={(formationId, userIds, durationMonths) =>
          controller.assignToUsers({ formationId, userIds, durationMonths })
        }
        onAssignGroup={(formationId, groupId, durationMonths) =>
          controller.assignToGroup({ formationId, groupId, durationMonths })
        }
        onCreateGroup={(nextTenantId, name, userIds) =>
          controller.createGroup({ tenantId: nextTenantId, name, userIds })
        }
        onEditGroup={(groupId, name, userIds) =>
          controller.updateGroup({ id: groupId, name, userIds })
        }
        onDeleteGroup={controller.deleteGroup}
      />
    </RoleGuard>
  );
}
