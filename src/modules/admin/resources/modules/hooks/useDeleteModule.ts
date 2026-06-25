import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminModulesApi } from "../api";
import type { Module } from "../types";
import { ADMIN_MODULES_QUERY_KEY } from "./useModulesQuery";

export function useDeleteModule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => adminModulesApi.remove(id),
    onSuccess: (_data, deletedId) => {
      queryClient.setQueryData<{ data: Module[]; total: number }>(
        ADMIN_MODULES_QUERY_KEY,
        (prev) => ({
          data: (prev?.data ?? []).filter((m) => m.id !== deletedId),
          total: (prev?.total ?? 1) - 1,
        }),
      );
    },
  });
}
