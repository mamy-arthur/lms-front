import { useMutation, useQueryClient } from '@tanstack/react-query';
import { groupsApi } from '@/shared/api/groups.api';
import { groupKeys } from '@/shared/queries/keys';

export function useUpdateGroupWithMembers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      name,
      traineeIds,
      previousName,
      previousTraineeIds,
    }: {
      id: string;
      name: string;
      traineeIds: string[];
      previousName: string;
      previousTraineeIds: string[];
    }): Promise<void> => {
      if (name !== previousName) {
        await groupsApi.update(id, { name });
      }

      const previousSet = new Set(previousTraineeIds);
      const nextSet = new Set(traineeIds);

      const toAdd = traineeIds.filter((traineeId) => !previousSet.has(traineeId));
      const toRemove = previousTraineeIds.filter((traineeId) => !nextSet.has(traineeId));

      const results = await Promise.allSettled([
        ...toAdd.map((traineeId) => groupsApi.addMember(id, { trainee_id: traineeId })),
        ...toRemove.map((traineeId) => groupsApi.removeMember(id, traineeId)),
      ]);
      const failures = results.filter((r) => r.status === 'rejected');
      if (failures.length > 0) {
        throw new Error(`Mise à jour partielle : ${failures.length} opération(s) ont échoué.`);
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: groupKeys.all });
    },
  });
}
