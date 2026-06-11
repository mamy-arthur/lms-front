import { useMutation, useQueryClient } from "@tanstack/react-query";
import { modulesApi } from "../api";
import type { CreateModulePayload, Module } from "../types";
import { normalizeModule } from "../types";
import { MODULES_QUERY_KEY } from "./useModulesQuery";

export function useCreateModule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateModulePayload) => modulesApi.create(data),
    onSuccess: ({ data: rawModule }) => {
      const newModule = normalizeModule(
        rawModule as unknown as Record<string, unknown>,
      );
      queryClient.setQueryData<{ data: Module[]; total: number }>(
        MODULES_QUERY_KEY,
        (prev) => ({
          data: [newModule, ...(prev?.data ?? [])],
          total: (prev?.total ?? 0) + 1,
        }),
      );
    },
  });
}
