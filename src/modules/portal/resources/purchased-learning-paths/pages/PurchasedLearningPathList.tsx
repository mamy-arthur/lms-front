'use client';

import { ChevronDown, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { RoleGuard } from '@/modules/auth/guards/RoleGuard';
import { UserSearch } from '@modules/shared/components/users';
import { ACCESS } from '@/shared/auth/permissions';
import { usePurchasedLearningPathList } from '../hooks/usePurchasedLearningPathList';
import { PurchasedLearningPathEnrollmentDrawer } from './_components/enrollment-drawer';
import { PurchasedLearningPathsTable } from './_components/paths-table';
import { PurchasedLearningPathStatsUsersDrawer } from './_components/stats-users-drawer';

export function PurchasedLearningPathList() {
  const {
    page,
    pageSize,
    total,
    isLoading,
    search,
    sort,
    categoryIds,
    availableCategories,
    sortedRows,
    statsDrawer,
    assignmentTargetRow,
    groups,
    setPage,
    setStatsDrawer,
    setAssignmentTarget,
    handleSearchChange,
    handleCategoryToggle,
    handleSort,
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

  const selectedCategories = availableCategories.filter((c) => categoryIds.includes(c.id));

  return (
    <RoleGuard
      rule={ACCESS.formationsManagement}
      fallback={
        <Card>
          <CardHeader>
            <CardTitle>Accès non autorisé</CardTitle>
            <CardDescription>
              Cette fonctionnalité est réservée au profil client manager.
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
          <div className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <UserSearch
                value={search}
                onChange={handleSearchChange}
                onSearch={() => {}}
              />
              <div className="flex items-center gap-2 sm:ml-auto flex-wrap">
                {availableCategories.length > 0 && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="justify-between text-xs font-normal">
                        {categoryIds.length === 0
                          ? 'Toutes les catégories'
                          : `${categoryIds.length} catégorie${categoryIds.length > 1 ? 's' : ''}`}
                        <ChevronDown className="ml-1 size-3.5 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-52 p-2" align="end">
                      <div className="space-y-0.5">
                        {availableCategories.map((cat) => (
                          <label
                            key={cat.id}
                            className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-muted text-xs"
                          >
                            <Checkbox
                              checked={categoryIds.includes(cat.id)}
                              onCheckedChange={() => handleCategoryToggle(cat.id)}
                              className="data-[state=checked]:bg-(--color-primary) data-[state=checked]:border-(--color-primary)"
                            />
                            {cat.name}
                          </label>
                        ))}
                      </div>
                      {categoryIds.length > 0 && (
                        <button
                          type="button"
                          className="mt-1.5 w-full rounded px-2 py-1 text-center text-xs text-muted-foreground hover:bg-muted"
                          onClick={() => categoryIds.forEach((id) => handleCategoryToggle(id))}
                        >
                          Effacer
                        </button>
                      )}
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            </div>

            {selectedCategories.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {selectedCategories.map((cat) => (
                  <Badge
                    key={cat.id}
                    variant="outline"
                    className="h-6 gap-1 px-2 text-xs font-normal bg-(--color-primary) text-white"
                  >
                    {cat.name}
                    <button
                      onClick={() => handleCategoryToggle(cat.id)}
                      className="ml-0.5 rounded-sm opacity-60 hover:opacity-100"
                      aria-label="Retirer ce filtre"
                    >
                      <X className="size-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            <PurchasedLearningPathsTable
              purchasedLearningPaths={sortedRows}
              page={page}
              pageSize={pageSize}
              total={total}
              hasQuery={Boolean(search || categoryIds.length > 0)}
              sort={sort}
              onSort={handleSort}
              onPageChange={setPage}
              onPageSizeChange={handlePageSizeChange}
              onStatClick={(purchasedLearningPath, stat) =>
                setStatsDrawer({ purchasedLearningPath, stat })
              }
              onAssign={(purchasedLearningPath) => setAssignmentTarget(purchasedLearningPath)}
            />
          </div>
        )}
      </div>

      <PurchasedLearningPathStatsUsersDrawer
        open={Boolean(statsDrawer.purchasedLearningPath)}
        onOpenChange={(open) => {
          if (!open) {
            setStatsDrawer({ purchasedLearningPath: null, stat: 'cumulative' });
          }
        }}
        purchasedLearningPathId={statsDrawer.purchasedLearningPath?.id ?? null}
        purchasedLearningPathName={statsDrawer.purchasedLearningPath?.name ?? ''}
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

