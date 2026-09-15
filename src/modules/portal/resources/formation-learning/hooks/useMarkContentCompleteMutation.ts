import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { portalContentEntriesApi } from '@/shared/api/portal.api';
import { portalLearningPathKeys, portalMyEnrollmentsKeys } from '@/shared/queries/keys';

interface Vars {
  competencyId: string;
  courseId: string;
  entryId: string;
}

/** Invalidates the enrollment summary so progress and completed flags refresh. */
export function useMarkContentCompleteMutation(enrollmentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ competencyId, courseId, entryId }: Vars) =>
      portalContentEntriesApi.markComplete(enrollmentId, competencyId, courseId, entryId),
    onSuccess: async () => {
      queryClient.invalidateQueries({
        queryKey: portalMyEnrollmentsKeys.all,
      });
      // Keep the mutation pending until navigation permissions are refreshed.
      await queryClient.invalidateQueries({
        queryKey: portalLearningPathKeys.summary(enrollmentId),
      });
    },
    onError: () => {
      toast.error('Erreur lors de la sauvegarde de la progression. Veuillez réessayer.');
    },
  });
}
