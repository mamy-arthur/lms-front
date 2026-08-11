'use client';

import { useMemo, useState } from 'react';
import { RoleGuard } from '@/modules/auth/guards/RoleGuard';
import { ACCESS } from '@/shared/auth/permissions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { usePurchasedLearningPathsQuery } from '../hooks/usePurchasedLearningPathsQuery';
import {
  filterEnrollmentsByStat,
  usePurchasedLearningPathsController,
} from '../hooks/usePurchasedLearningPathsController';
import type { PurchasedLearningPathRow, PurchasedLearningPathStatKey } from '../types';
import { PurchasedLearningPathsTable } from './_components/paths-table';
import { PurchasedLearningPathStatsUsersDrawer } from './_components/stats-users-drawer';
import { PurchasedLearningPathAssignmentDrawer } from './_components/assignment-drawer';

export function PurchasedLearningPathList() {
  /** Index 0-based pour DataTable ; l’API attend page 1-based. */
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);

  const [statsDrawer, setStatsDrawer] = useState<{
    purchasedLearningPath: PurchasedLearningPathRow | null;
    stat: PurchasedLearningPathStatKey;
  }>({
    purchasedLearningPath: null,
    stat: 'cumulative',
  });

  const [assignmentTarget, setAssignmentTarget] = useState<PurchasedLearningPathRow | null>(null);

  const { data, isLoading } = usePurchasedLearningPathsQuery({
    page: page + 1,
    perPage: pageSize,
  });

  const controller = usePurchasedLearningPathsController({
    purchasedLearningPaths: data?.purchasedLearningPaths ?? [],
    users: data?.users ?? [],
    groups: data?.groups ?? [],
  });

  const total = data?.meta.total ?? 0;

  const statsUsers = useMemo(() => {
    if (!statsDrawer.purchasedLearningPath) {
      return [];
    }

    return filterEnrollmentsByStat(statsDrawer.purchasedLearningPath, statsDrawer.stat);
  }, [statsDrawer]);

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
            <h1 className="text-2xl font-bold tracking-tight">
              Gestion des parcours de formations
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Gérez vos parcours de formation et leur affectation aux utilisateurs.
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
          <PurchasedLearningPathsTable
            purchasedLearningPaths={controller.purchasedLearningPathRows}
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={setPage}
            onPageSizeChange={handlePageSizeChange}
            onStatClick={(purchasedLearningPath, stat) =>
              setStatsDrawer({ purchasedLearningPath, stat })
            }
            onAssign={(purchasedLearningPath) => setAssignmentTarget(purchasedLearningPath)}
          />
        )}
      </div>

      <PurchasedLearningPathStatsUsersDrawer
        open={Boolean(statsDrawer.purchasedLearningPath)}
        onOpenChange={(open) => {
          if (!open) {
            setStatsDrawer({ purchasedLearningPath: null, stat: 'cumulative' });
          }
        }}
        purchasedLearningPathName={statsDrawer.purchasedLearningPath?.name ?? ''}
        stat={statsDrawer.stat}
        users={statsUsers}
      />

      <PurchasedLearningPathAssignmentDrawer
        open={Boolean(assignmentTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setAssignmentTarget(null);
          }
        }}
        purchasedLearningPath={assignmentTarget}
        users={controller.users}
        groups={controller.groups}
        onAssignUsers={(purchasedLearningPathId, userIds) =>
          controller.assignToUsers({ purchasedLearningPathId, userIds })
        }
        onAssignGroup={(purchasedLearningPathId, groupId) =>
          controller.assignToGroup({ purchasedLearningPathId, groupId })
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
