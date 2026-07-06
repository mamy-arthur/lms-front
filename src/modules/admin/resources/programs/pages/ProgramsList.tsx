'use client';

import { useState } from 'react';
import { ProgramDrawer } from '../components/ProgramDrawer';
import { ProgramsTable } from '../components/programs-table';
import { useProgramStore } from '../hooks/useProgramStore';
import type { ProgramFormValues } from '../components/ProgramFormPanel';
import type { StoredFlowData, StoredProgram } from '../types';

export function ProgramsList() {
  const { programs, create, update, remove } = useProgramStore();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<StoredProgram | undefined>(undefined);

  const openNew = () => {
    setEditingProgram(undefined);
    setDrawerOpen(true);
  };

  const openEdit = (program: StoredProgram) => {
    setEditingProgram(program);
    setDrawerOpen(true);
  };

  const handleSave = (id: string | null, formValues: ProgramFormValues, flow: StoredFlowData) => {
    if (id) {
      update(id, formValues, flow);
    } else {
      create(formValues, flow);
    }
  };

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
        <ProgramsTable programs={programs} onNew={openNew} onEdit={openEdit} onDelete={remove} />
        <ProgramDrawer
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          program={editingProgram}
          onSave={handleSave}
        />
      </div>
    </div>
  );
}
