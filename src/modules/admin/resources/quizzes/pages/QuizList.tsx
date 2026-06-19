"use client";

import { Plus } from "lucide-react";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { QuizSearch } from "@modules/shared/components/quizzes";
import { useAllTenantsQuery } from "@/modules/shared/hooks/useAllTenantsQuery";
import { useModuleListController } from "@/modules/shared/hooks/useModuleListController";
import { useQuizzesQuery } from "../hooks/useQuizzesQuery";
import type { Quiz } from "../types";
import { AdminQuizFormDrawer } from "./_components/admin-quiz-form-drawer";
import { AdminQuizzesFilter } from "./_components/admin-quizzes-filter";
import { AdminQuizzesTable } from "./_components/admin-quizzes-table";

export function QuizList() {
  const ctrl = useModuleListController<Quiz>({
    includeTenantFilter: true,
    defaultPageSize: 25,
  });
  const { data: tenantsData } = useAllTenantsQuery();
  const tenants = tenantsData?.data ?? [];
  const { data, isLoading } = useQuizzesQuery(ctrl.params);

  const tenantNames = useMemo(() => {
    const map: Record<string, string> = {};
    for (const t of tenants) {
      map[String(t.id)] = t.name;
    }
    return map;
  }, [tenants]);

  return (
    <div className="bg-background">
      <header className="mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quizzes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Créez, modifiez et organisez les quizzes.
          </p>
        </div>
      </header>

      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-2">
        <QuizSearch
          value={ctrl.draftSearch}
          onChange={ctrl.setDraftSearch}
          onSearch={ctrl.handleSearch}
        />
        <div className="flex items-center gap-2 sm:ml-auto">
          <AdminQuizzesFilter
            formationFilter={ctrl.draftCategory}
            tenantFilter={ctrl.draftTenant}
            onFormationFilterChange={ctrl.setDraftCategory}
            onTenantFilterChange={ctrl.setDraftTenant}
            onSearch={ctrl.handleSearch}
            tenants={tenants}
          />
          <Button
            onClick={ctrl.handleOpenCreate}
            className="bg-(--color-primary) hover:bg-(--color-primary)/80 text-primary-foreground shrink-0"
          >
            <Plus className="size-4" />
            Nouveau quiz
          </Button>
        </div>
      </div>

      <AdminQuizzesTable
        quizzes={data?.data ?? []}
        isLoading={isLoading}
        hasQuery={ctrl.hasQuery}
        page={ctrl.page}
        pageSize={ctrl.pageSize}
        total={data?.total ?? 0}
        sort={ctrl.sort}
        onSort={ctrl.handleSort}
        onPageChange={ctrl.handlePageChange}
        onPageSizeChange={ctrl.handlePageSizeChange}
        onEdit={ctrl.handleEdit}
        onDelete={() => {}}
        tenantNames={tenantNames}
      />

      <AdminQuizFormDrawer
        open={ctrl.isDrawerOpen}
        onClose={ctrl.handleCloseDrawer}
        onSuccess={ctrl.handleSuccess}
        quiz={ctrl.editingModule}
        tenants={tenants}
      />
    </div>
  );
}
