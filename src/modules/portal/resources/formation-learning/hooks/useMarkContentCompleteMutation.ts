import { useMutation, useQueryClient } from '@tanstack/react-query';
import { portalContentEntriesApi } from '@/shared/api/portal.api';
import { portalLearningPathKeys, portalMyEnrollmentsKeys } from '@/shared/queries/keys';

interface Vars {
  courseId: string;
  entryId: string;
}

/** Invalidates the enrollment summary so progress and completed flags refresh. */
export function useMarkContentCompleteMutation(enrollmentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ courseId, entryId }: Vars) =>
      portalContentEntriesApi.markComplete(enrollmentId, courseId, entryId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: portalLearningPathKeys.summary(enrollmentId),
      });
      queryClient.invalidateQueries({
        queryKey: portalMyEnrollmentsKeys.all,
      });
    },
  });
}
