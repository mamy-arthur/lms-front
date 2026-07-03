'use client';

import { useState } from 'react';
import { ProgramDrawer } from '../components/ProgramDrawer';
import { ProgramsTable } from '../components/programs-table';

export function ProgramsList() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="bg-background">
      <div className="mx-auto w-full">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Gestion des parcours</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Créez, modifiez et organisez les parcours de votre plateforme.
            </p>
          </div>
        </header>
        <ProgramsTable onNew={() => setDrawerOpen(true)} />
        <ProgramDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
      </div>
    </div>
  );
}
