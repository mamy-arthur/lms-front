import { useQuery } from "@tanstack/react-query";
import { MOCK_ADMIN_MODULES } from "@/shared/mocks/modules-admin.mock";
import type { ModuleSearchParams } from "../types";
import { normalizeModule } from "../types";

export const ADMIN_MODULES_QUERY_KEY = ["admin", "modules"] as const;

export function useModulesQuery(params?: ModuleSearchParams) {
  return useQuery({
    queryKey: [...ADMIN_MODULES_QUERY_KEY, params],
    queryFn: () => {
      const data = MOCK_ADMIN_MODULES.map((m) => normalizeModule(m));
      return { data, total: data.length };
    },
    placeholderData: (prev) => prev,
  });
}
