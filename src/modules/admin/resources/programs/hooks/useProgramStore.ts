'use client';

import { useState } from 'react';
import type { ProgramFormValues } from '../components/ProgramFormPanel';
import type { StoredFlowData, StoredProgram } from '../types';
import { MOCK_PROGRAMS } from '../mock/programs.mock';

let _idCounter = MOCK_PROGRAMS.length;
const nextId = () => `prog-${++_idCounter}`;

export function useProgramStore() {
  const [programs, setPrograms] = useState<StoredProgram[]>(MOCK_PROGRAMS);

  function create(
    formValues: ProgramFormValues,
    flow: StoredFlowData,
    status: StoredProgram['status'] = 'Brouillon',
  ): string {
    const id = nextId();
    const now = new Date().toISOString();
    setPrograms((prev) => [
      ...prev,
      { id, status, formValues, flow, createdAt: now, updatedAt: now },
    ]);
    return id;
  }

  function update(id: string, formValues: ProgramFormValues, flow: StoredFlowData): void {
    setPrograms((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, formValues, flow, updatedAt: new Date().toISOString() } : p,
      ),
    );
  }

  function remove(id: string): void {
    setPrograms((prev) => prev.filter((p) => p.id !== id));
  }

  return { programs, create, update, remove };
}
