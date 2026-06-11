import { useMutation, useQueryClient } from "@tanstack/react-query";
import { modulesApi } from "../api";
import type { Module, UpdateModulePayload } from "../types";
import { normalizeModule } from "../types";
import { MODULES_QUERY_KEY } from "./useModulesQuery";

export function useUpdateModule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateModulePayload }) =>
      modulesApi.update(id, data),
    onSuccess: ({ data: rawModule }) => {
      const updated = normalizeModule(
        rawModule as unknown as Record<string, unknown>,
      );
      queryClient.setQueryData<{ data: Module[]; total: number }>(
        MODULES_QUERY_KEY,
        (prev) => ({
          data: (prev?.data ?? []).map((m) =>
            m.id === updated.id ? updated : m,
          ),
          total: prev?.total ?? 0,
        }),
      );
    },
  });
}
