import { useQuery } from "@tanstack/react-query";
import { applyModuleParams } from "@/shared/components/modules/module-form-utils";
import { MOCK_ADMIN_MODULES } from "@/shared/mocks/modules-admin.mock";
import { normalizeModule } from "../types";
import type { Module, ModuleSearchParams } from "../types";

export const ADMIN_MODULES_QUERY_KEY = ["admin", "modules"] as const;

export function useModulesQuery(params?: ModuleSearchParams) {
  return useQuery({
    queryKey: [...ADMIN_MODULES_QUERY_KEY, params],
    queryFn: () => {
      const all = MOCK_ADMIN_MODULES.map((m) => normalizeModule(m));
      return applyModuleParams(all, params, 25);
    },
    placeholderData: (prev) => prev,
  });
}
