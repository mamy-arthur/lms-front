'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { KpiCards } from './components/KpiCards';
import { StudentsTable } from './components/students-table';
import { StudentDrawer } from './components/students-drawer';
import { ProgressCard } from './components/chart/chart-radial-text';
import { useClientDashboardQuery, useClientDashboardScope } from './hooks/useClientDashboardQuery';
import type { DashboardStudent } from './types';

export default function ClientDashboard() {
  const scope = useClientDashboardScope();
  return <ClientDashboardContent key={JSON.stringify(scope.key)} enabled={scope.enabled} />;
}

function ClientDashboardContent({ enabled }: { enabled: boolean }) {
  const { overview, students } = useClientDashboardQuery();
  const [selectedStudent, setSelectedStudent] = useState<DashboardStudent | null>(null);
  const drawerTrigger = useRef<HTMLElement | null>(null);

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
          <div className="grid min-w-0 grid-cols-2 gap-3 md:grid-cols-4 md:grid-rows-2">
            <KpiCards data={overview.data} />
            <ProgressCard
              students={students.data}
              className="col-span-2 col-start-1 row-start-3 md:col-start-3 md:row-start-1 md:row-span-2"
            />
          </div>
          <StudentsTable
            students={students.data ?? []}
            loading={students.isPending}
            error={students.isError}
            onSelect={
              enabled
                ? (student, trigger) => {
                    drawerTrigger.current = trigger;
                    setSelectedStudent(student);
                  }
                : undefined
            }
          />
          <StudentDrawer
            student={enabled ? selectedStudent : null}
            open={enabled && selectedStudent !== null}
            onOpenChange={(open) => {
              if (!open) setSelectedStudent(null);
            }}
            onRestoreFocus={() => drawerTrigger.current?.focus()}
          />
        </div>
      </div>
    </div>
  );
}
