'use client';

export type {
  ListSearchParams as QuizSearchParams,
  UseListControllerOptions as UseQuizListControllerOptions,
} from './useListController';
import { useListController, type UseListControllerOptions } from './useListController';

export function useQuizListController<TQuiz>(opts?: UseListControllerOptions) {
  const ctrl = useListController<TQuiz>(opts);
  return {
    ...ctrl,
    editingQuiz: ctrl.editingItem,
  } as const;
}
