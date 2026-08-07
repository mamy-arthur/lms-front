import { useMutation, useQueryClient } from "@tanstack/react-query";
import { enrollmentsApi } from "@/shared/api/enrollments.api";
import { enrollmentKeys, purchasedLearningPathKeys } from "@/shared/queries/keys";
import type {
  CreateEnrollmentPayload,
  CreateEnrollmentResponse,
} from "@/shared/types/enrollment.types";

export function useCreateEnrollments() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      payload: CreateEnrollmentPayload,
    ): Promise<CreateEnrollmentResponse> => enrollmentsApi.create(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: enrollmentKeys.all });
      void queryClient.invalidateQueries({ queryKey: purchasedLearningPathKeys.all });
    },
  });
}
