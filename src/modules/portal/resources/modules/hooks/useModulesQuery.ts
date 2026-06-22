import { useQuery } from "@tanstack/react-query";
import { MOCK_ADMIN_MODULES } from "@modules/shared/components/modules/mocks/modules-admin.mock";
import type { Module, ModuleSearchParams } from "../types";
import { normalizeModule } from "../types";

export const MODULES_QUERY_KEY = ["portal", "modules"] as const;

export function useModulesQuery(params?: ModuleSearchParams) {
  return useQuery<{ data: Module[]; total: number }>({
    queryKey: [...MODULES_QUERY_KEY, params],
    queryFn: () => {
      const data = MOCK_ADMIN_MODULES.map((m) => normalizeModule(m));
      return { data, total: data.length };
    },
    placeholderData: (prev) => prev,
  });
}
