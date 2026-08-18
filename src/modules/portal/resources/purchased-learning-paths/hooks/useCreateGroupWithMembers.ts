import { useMutation, useQueryClient } from '@tanstack/react-query';
import { groupsApi } from '@/shared/api/groups.api';
import { groupKeys } from '@/shared/queries/keys';
import type { AssignableGroup } from '../types';

export function useCreateGroupWithMembers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      name,
      traineeIds,
    }: {
      name: string;
      traineeIds: string[];
    }): Promise<AssignableGroup> => {
      const { data: created } = await groupsApi.create({ name });

      try {
        await Promise.all(
          traineeIds.map((traineeId) => groupsApi.addMember(created.id, { trainee_id: traineeId })),
        );
      } catch {
        // Rollback: remove the group if member additions fail
        await groupsApi.remove(created.id).catch(() => {});
        throw new Error("Impossible d'ajouter les membres au groupe.");
      }

      return {
        id: created.id,
        tenantId: created.tenant_id,
        name: created.name,
        userIds: traineeIds,
      };
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: groupKeys.all });
    },
  });
}
