import { useQuery } from "@tanstack/react-query";
import { MOCK_MODULES } from "../mocks/modules.mock";
import type { Module, ModuleSearchParams } from "../types";

export const MODULES_QUERY_KEY = ["portal", "modules"] as const;

export function useModulesQuery(params?: ModuleSearchParams) {
  return useQuery<{ data: Module[]; total: number }>({
    queryKey: [...MODULES_QUERY_KEY, params],
    queryFn: () => {
      const data = [...MOCK_MODULES];
      return { data, total: data.length };
    },
    placeholderData: (prev) => prev,
  });
}
