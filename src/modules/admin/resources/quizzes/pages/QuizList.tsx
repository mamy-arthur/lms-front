"use client";

import { useMemo } from "react";
import { QuizSearch } from "@modules/shared/components/quizzes";
import { useAllTenantsQuery } from "@/modules/shared/hooks/useAllTenantsQuery";
import { useQuizListController } from "@/modules/shared/hooks/useQuizListController";
import { useQuizzesQuery } from "../hooks/useQuizzesQuery";
import type { Quiz } from "../types";
import { AdminQuizzesFilter } from "./_components/admin-quizzes-filter";
import { AdminQuizzesTable } from "./_components/admin-quizzes-table";

export function QuizList() {
  const ctrl = useQuizListController<Quiz>({
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
      <header className="mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quizzes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Consultez les quizzes de vos formations.
          </p>
        </div>
      </header>

      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <QuizSearch
            value={ctrl.draftSearch}
            onChange={ctrl.setDraftSearch}
            onSearch={ctrl.handleSearch}
          />
          <div className="flex items-center gap-2 sm:ml-auto">
            <AdminQuizzesFilter
              formationFilter={ctrl.draftCategory.includes("all") ? "all" : ctrl.draftCategory[0] ?? "all"}
              tenantFilter={ctrl.draftTenant}
              onFormationFilterChange={(value) => ctrl.setDraftCategory([value])}
              onTenantFilterChange={ctrl.setDraftTenant}
              onSearch={ctrl.handleSearch}
              tenants={tenants}
            />
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
          tenantNames={tenantNames}
        />
      </div>
    </div>
  );
}
