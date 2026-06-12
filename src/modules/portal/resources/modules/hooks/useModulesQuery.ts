import { useQuery } from "@tanstack/react-query";
import { MOCK_MODULES } from "../mocks/modules.mock";
import type { Module, ModuleSearchParams } from "../types";

export const MODULES_QUERY_KEY = ["portal", "modules"] as const;

function applyParams(
  modules: Module[],
  params?: ModuleSearchParams,
): { data: Module[]; total: number } {
  let filtered = [...modules];

  if (params?.q) {
    const q = params.q.toLowerCase();
    filtered = filtered.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.identifier.toLowerCase().includes(q),
    );
  }

  if (params?.category) {
    filtered = filtered.filter((m) => m.category === params.category);
  }

  const sortBy = params?.sort_by ?? "name";
  const sortDir = params?.sort_dir ?? "asc";

  filtered.sort((a, b) => {
    const aVal = String(a[sortBy as keyof Module] ?? "");
    const bVal = String(b[sortBy as keyof Module] ?? "");
    const cmp = aVal.localeCompare(bVal);
    return sortDir === "desc" ? -cmp : cmp;
  });

  const page = params?.page ?? 0;
  const pageSize = params?.page_size ?? 12;
  const start = page * pageSize;
  const paginated = filtered.slice(start, start + pageSize);

  return { data: paginated, total: filtered.length };
}

export function useModulesQuery(
  params?: ModuleSearchParams,
) {
  return useQuery<{ data: Module[]; total: number }>({
    queryKey: [...MODULES_QUERY_KEY, params],
    queryFn: () => applyParams(MOCK_MODULES, params),
    placeholderData: (prev) => prev,
  });
}
