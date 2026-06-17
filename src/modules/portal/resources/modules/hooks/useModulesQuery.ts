import { useQuery } from "@tanstack/react-query";
import { applyModuleParams } from "@/shared/components/modules/module-form-utils";
import { MOCK_MODULES } from "../mocks/modules.mock";
import type { Module, ModuleSearchParams } from "../types";

export const MODULES_QUERY_KEY = ["portal", "modules"] as const;

export function useModulesQuery(
  params?: ModuleSearchParams,
) {
  return useQuery<{ data: Module[]; total: number }>({
    queryKey: [...MODULES_QUERY_KEY, params],
    queryFn: () => applyModuleParams(MOCK_MODULES, params, 12),
    placeholderData: (prev) => prev,
  });
}
