"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { RoleGuard } from "@/modules/auth/guards/RoleGuard";
import { ACCESS } from "@/shared/auth/permissions";
import { usePurchasedLearningPathList } from "../hooks/usePurchasedLearningPathList";
import { PurchasedLearningPathEnrollmentDrawer } from "./_components/enrollment-drawer";
import { PurchasedLearningPathsTable } from "./_components/paths-table";
import { PurchasedLearningPathStatsUsersDrawer } from "./_components/stats-users-drawer";

export function PurchasedLearningPathList() {
  const {
    page,
    pageSize,
    total,
    isLoading,
    sortedRows,
    statsDrawer,
    assignmentTargetRow,
    trainees,
    groups,
    setPage,
    setStatsDrawer,
    setAssignmentTarget,
    handlePageSizeChange,
    handleCreateGroup,
    handleEditGroup,
    handleDeleteGroup,
    handleAssign,
    isCreatingGroup,
    isUpdatingGroup,
    isDeletingGroup,
    isAssigning,
  } = usePurchasedLearningPathList();

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
              Gérez vos parcours de formation et leur affectation aux
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
          <PurchasedLearningPathsTable
            purchasedLearningPaths={sortedRows}
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={setPage}
            onPageSizeChange={handlePageSizeChange}
            onStatClick={(purchasedLearningPath, stat) =>
              setStatsDrawer({ purchasedLearningPath, stat })
            }
            onAssign={(purchasedLearningPath) =>
              setAssignmentTarget(purchasedLearningPath)
            }
          />
        )}
      </div>

      <PurchasedLearningPathStatsUsersDrawer
        open={Boolean(statsDrawer.purchasedLearningPath)}
        onOpenChange={(open) => {
          if (!open) {
            setStatsDrawer({ purchasedLearningPath: null, stat: "cumulative" });
          }
        }}
        purchasedLearningPathId={statsDrawer.purchasedLearningPath?.id ?? null}
        purchasedLearningPathName={
          statsDrawer.purchasedLearningPath?.name ?? ""
        }
        stat={statsDrawer.stat}
      />

      <PurchasedLearningPathEnrollmentDrawer
        open={Boolean(assignmentTargetRow)}
        onOpenChange={(open) => {
          if (!open) {
            setAssignmentTarget(null);
          }
        }}
        purchasedLearningPath={assignmentTargetRow}
        users={trainees}
        groups={groups}
        onCreateGroup={handleCreateGroup}
        onEditGroup={handleEditGroup}
        onDeleteGroup={handleDeleteGroup}
        onAssign={handleAssign}
        isCreatingGroup={isCreatingGroup}
        isUpdatingGroup={isUpdatingGroup}
        isDeletingGroup={isDeletingGroup}
        isAssigning={isAssigning}
      />
    </RoleGuard>
  );
}
