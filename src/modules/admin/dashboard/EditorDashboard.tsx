'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/shared/constants/routes';
import { StudentProgressOverview } from './components/StudentProgressOverview';
import { FormationProgressSection } from './components/FormationProgressSection';
import { FormationCatalogOverview } from './components/FormationCatalogOverview';
import { useEditorDashboardOverviewQuery } from './hooks/useEditorDashboardQuery';
import { ArrowRight } from 'lucide-react';

export function EditorDashboard() {
  const overview = useEditorDashboardOverviewQuery();

  return (
    <div className="mx-auto w-full space-y-6 bg-background">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tableau de bord formations</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Suivez la progression de vos étudiants et identifiez les formations à accompagner.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href={ROUTES.admin.programs}>
            Gérer les formations <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
      </header>
      {overview.isError ? (
        <div role="alert" className="space-y-3 rounded-sm border p-5">
          <p className="text-sm">Impossible de charger la synthèse du tableau de bord.</p>
          <Button
            variant="outline"
            onClick={() => {
              void overview.refetch();
            }}
          >
            Réessayer la synthèse
          </Button>
        </div>
      ) : overview.data ? (
        <div className="space-y-6" aria-busy={overview.isFetching}>
          <FormationCatalogOverview catalog={overview.data.catalog} />
          <StudentProgressOverview students={overview.data.students} />
        </div>
      ) : (
        <div role="status" aria-label="Chargement de la synthèse" className="space-y-6">
          <Skeleton className="h-36 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      )}
      <FormationProgressSection />
    </div>
  );
}
