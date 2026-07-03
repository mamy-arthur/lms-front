'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

export interface ModuleCategory {
  id: string;
  name: string;
  identifier: string;
  description: string;
  visible: boolean;
}

function generateId(identifier: string): string {
  return identifier
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .toLowerCase()
    .replace(/^-|-$/g, '');
}

const DEFAULT_CATEGORIES: ModuleCategory[] = [
  { id: 'formation', name: 'Formation', identifier: 'formation', description: '', visible: true },
  {
    id: 'certification',
    name: 'Certification',
    identifier: 'certification',
    description: '',
    visible: true,
  },
  { id: 'parcours', name: 'Parcours', identifier: 'parcours', description: '', visible: true },
  {
    id: 'specialisation',
    name: 'Spécialisation',
    identifier: 'specialisation',
    description: '',
    visible: true,
  },
];

export interface ModuleCategoryInput {
  name: string;
  identifier: string;
  description: string;
  visible: boolean;
}

interface ModuleCategoryContextType {
  categories: ModuleCategory[];
  addCategory: (input: ModuleCategoryInput) => ModuleCategory;
  updateCategory: (id: string, input: ModuleCategoryInput) => void;
  deleteCategory: (id: string) => void;
  getLabel: (id: string) => string;
}

const ModuleCategoryContext = createContext<ModuleCategoryContextType | null>(null);

export function ModuleCategoryProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<ModuleCategory[]>(DEFAULT_CATEGORIES);

  const addCategory = useCallback((input: ModuleCategoryInput): ModuleCategory => {
    const id = generateId(input.identifier);
    const newCat: ModuleCategory = { ...input, id };
    setCategories((prev) => [...prev, newCat]);
    return newCat;
  }, []);

  const updateCategory = useCallback((id: string, input: ModuleCategoryInput) => {
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...input } : c)));
  }, []);

  const deleteCategory = useCallback((id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const getLabel = useCallback(
    (id: string) => categories.find((c) => c.id === id)?.name ?? id,
    [categories],
  );

  const value = useMemo(
    () => ({ categories, addCategory, updateCategory, deleteCategory, getLabel }),
    [categories, addCategory, updateCategory, deleteCategory, getLabel],
  );

  return <ModuleCategoryContext.Provider value={value}>{children}</ModuleCategoryContext.Provider>;
}

export function useModuleCategoryStore() {
  const ctx = useContext(ModuleCategoryContext);
  if (!ctx) throw new Error('useModuleCategoryStore must be used within ModuleCategoryProvider');
  return ctx;
}
