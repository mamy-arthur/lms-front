import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { portalContentEntriesApi } from '@/shared/api/portal.api';
import { portalLearningPathKeys, portalMyEnrollmentsKeys } from '@/shared/queries/keys';
import type { ExecutionMutationContext } from '@/shared/types/progression.types';
import { EXECUTION_CONFLICT_MESSAGE } from '../lib/constants';
import { adoptExecutionSnapshot } from '../lib/execution-cache';
import { useExecutionConflictRecovery } from './useExecutionConflictRecovery';

interface Vars {
  competencyId: string;
  courseId: string;
  entryId: string;
  /** Visite et révision lues pour ce module. */
  context: ExecutionMutationContext;
}

/** Invalidates the enrollment summary so progress and completed flags refresh. */
export function useMarkContentCompleteMutation(enrollmentId: string) {
  const queryClient = useQueryClient();
  const recoverFromConflict = useExecutionConflictRecovery(enrollmentId);

  return useMutation({
    mutationFn: ({ competencyId, courseId, entryId, context }: Vars) =>
      portalContentEntriesApi.markComplete(enrollmentId, competencyId, courseId, entryId, context),
    onSuccess: async ({ data }) => {
      adoptExecutionSnapshot(queryClient, enrollmentId, data);
      queryClient.invalidateQueries({
        queryKey: portalMyEnrollmentsKeys.all,
      });
      // Keep the mutation pending until navigation permissions are refreshed.
      await queryClient.invalidateQueries({
        queryKey: portalLearningPathKeys.summary(enrollmentId),
      });
    },
    onError: (err) => {
      // Un contexte refusé n'est pas une panne : l'état serveur a simplement
      // avancé, et inviter à « réessayer » y serait trompeur.
      if (recoverFromConflict(err)) {
        toast.error(EXECUTION_CONFLICT_MESSAGE);
        return;
      }
      toast.error('Erreur lors de la sauvegarde de la progression. Veuillez réessayer.');
    },
  });
}
