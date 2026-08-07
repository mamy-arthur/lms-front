import { useMutation, useQueryClient } from "@tanstack/react-query";
import { groupsApi } from "@/shared/api/groups.api";
import { groupKeys } from "@/shared/queries/keys";
import { mapApiGroupToAssignable } from "../lib/mappers";
import type { AssignableGroup } from "../types";

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

      let group = created;
      for (const traineeId of traineeIds) {
        const response = await groupsApi.addMember(group.id, {
          trainee_id: traineeId,
        });
        group = response.data;
      }

      return mapApiGroupToAssignable(group);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: groupKeys.all });
    },
  });
}
