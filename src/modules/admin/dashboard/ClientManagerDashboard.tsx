'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/shared/constants/routes';
import { StudentProgressOverview } from './components/StudentProgressOverview';
import { FormationProgressCards } from './components/FormationProgressCards';
import { FormationCatalogOverview } from './components/FormationCatalogOverview';
import { ArrowRight } from 'lucide-react';

export function ClientManagerDashboard() {
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
      <FormationCatalogOverview />
      <StudentProgressOverview />
      <FormationProgressCards />
    </div>
  );
}
