'use client';

import { Button } from '@/components/ui/button';
import { KpiCards } from './components/KpiCards';
import { StudentsTable } from './components/students-table';
import { ProgressCard } from './components/chart/chart-radial-text';
import { useClientDashboardQuery, useClientDashboardScope } from './hooks/useClientDashboardQuery';

export default function ClientDashboard() {
  const scope = useClientDashboardScope();
  return <ClientDashboardContent key={JSON.stringify(scope.key)} />;
}

function ClientDashboardContent() {
  const { overview, students } = useClientDashboardQuery();

  return (
    <div className="bg-background flex flex-col">
      <div className="mx-auto w-full">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Tableau de bord</h1>{' '}
            <p className="mt-1 text-sm text-muted-foreground">
              Suivez la progression de vos étudiants et la consommation de votre forfait en un coup
              d'œil.
            </p>
          </div>
        </header>
        <div className="flex flex-col space-y-3">
          {(overview.isError || students.isError) && (
            <div
              role="alert"
              className="flex items-center justify-between gap-3 rounded-md border p-3 text-sm"
            >
              <p>
                {overview.isError && students.isError
                  ? 'Impossible de charger le tableau de bord.'
                  : `Impossible de charger ${overview.isError ? 'les indicateurs' : 'les étudiants'}.`}
              </p>
              <Button
                variant="outline"
                disabled={overview.isFetching || students.isFetching}
                onClick={() => {
                  if (overview.isError) void overview.refetch();
                  if (students.isError) void students.refetch();
                }}
              >
                Réessayer
              </Button>
            </div>
          )}
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-4 lg:grid-rows-2">
            <KpiCards data={overview.data} />
            <ProgressCard
              students={students.data}
              className="lg:col-start-3 lg:col-span-2 lg:row-start-1 lg:row-span-2"
            />
          </div>
          <StudentsTable
            students={students.data ?? []}
            loading={students.isPending}
            error={students.isError}
          />
        </div>
      </div>
    </div>
  );
}
