import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminUsersApi } from "../api";
import type { CreateUserPayload } from "../types";

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateUserPayload> }) =>
      adminUsersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}
