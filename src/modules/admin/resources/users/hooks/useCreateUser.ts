import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminUsersApi } from "../api";
import type { CreateUserPayload } from "../types";

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateUserPayload) => adminUsersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}
