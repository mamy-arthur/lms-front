import { useMutation, useQueryClient } from '@tanstack/react-query';
import { assignmentsApi } from '@/shared/api/assignments.api';
import { assignmentKeys } from '@/shared/queries/keys';
import type {
  CreateAssignmentPayload,
  CreateAssignmentResponse,
} from '@/shared/types/assignment.types';

export function useCreateAssignments() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateAssignmentPayload): Promise<CreateAssignmentResponse> =>
      assignmentsApi.create(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: assignmentKeys.all });
    },
  });
}
