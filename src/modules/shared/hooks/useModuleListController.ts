'use client';

export type {
  ListSearchParams as ModuleSearchParams,
  UseListControllerOptions as UseModuleListControllerOptions,
} from './useListController';
import { useListController, type UseListControllerOptions } from './useListController';

export function useModuleListController<TModule>(opts?: UseListControllerOptions) {
  const ctrl = useListController<TModule>(opts);
  return {
    ...ctrl,
    editingModule: ctrl.editingItem,
  } as const;
}
