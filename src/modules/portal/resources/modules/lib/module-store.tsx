"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";

export interface ModuleCategory {
  value: string;
  label: string;
}

const DEFAULT_CATEGORIES: ModuleCategory[] = [
  { value: "formation", label: "Formation" },
  { value: "certification", label: "Certification" },
  { value: "parcours", label: "Parcours" },
  { value: "specialisation", label: "Spécialisation" },
];

interface ModuleCategoryContextType {
  categories: ModuleCategory[];
  addCategory: (label: string) => ModuleCategory;
  getLabel: (value: string) => string;
}

const ModuleCategoryContext = createContext<ModuleCategoryContextType | null>(
  null,
);

export function ModuleCategoryProvider({
  children,
}: { children: ReactNode }) {
  const [categories, setCategories] =
    useState<ModuleCategory[]>(DEFAULT_CATEGORIES);

  const addCategory = useCallback((label: string): ModuleCategory => {
    const value = label
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .toLowerCase()
      .replace(/^-|-$/g, "");
    const newCat: ModuleCategory = { value, label };
    setCategories((prev) => [...prev, newCat]);
    return newCat;
  }, []);

  const getLabel = useCallback(
    (value: string) =>
      categories.find((c) => c.value === value)?.label ?? value,
    [categories],
  );

  const value = useMemo(
    () => ({ categories, addCategory, getLabel }),
    [categories, addCategory, getLabel],
  );

  return (
    <ModuleCategoryContext.Provider value={value}>
      {children}
    </ModuleCategoryContext.Provider>
  );
}

export function useModuleCategoryStore() {
  const ctx = useContext(ModuleCategoryContext);
  if (!ctx)
    throw new Error(
      "useModuleCategoryStore must be used within ModuleCategoryProvider",
    );
  return ctx;
}
