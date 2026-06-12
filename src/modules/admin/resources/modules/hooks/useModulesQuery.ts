import { useQuery } from "@tanstack/react-query";
import { MOCK_ADMIN_MODULES } from "@/shared/mocks/modules-admin.mock";
import { normalizeModule } from "../types";
import type { Module, ModuleSearchParams } from "../types";

export const ADMIN_MODULES_QUERY_KEY = ["admin", "modules"] as const;

function applyParams(
  modules: Module[],
  params?: ModuleSearchParams,
): { data: Module[]; total: number } {
  let data = [...modules];

  if (params?.q) {
    const q = params.q.toLowerCase();
    data = data.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.identifier.toLowerCase().includes(q),
    );
  }
  if (params?.category) {
    data = data.filter((m) => m.category === params.category);
  }
  if (params?.tenant_id) {
    data = data.filter((m) => m.tenantId === params.tenant_id);
  }

  const col = params?.sort_by || "name";
  const dir = params?.sort_dir || "asc";
  data.sort((a, b) => {
    const aVal = String(a[col as keyof Module] ?? "");
    const bVal = String(b[col as keyof Module] ?? "");
    const cmp = aVal.localeCompare(bVal);
    return dir === "asc" ? cmp : -cmp;
  });

  const total = data.length;
  const page = params?.page ?? 0;
  const pageSize = params?.page_size ?? 25;
  data = data.slice(page * pageSize, (page + 1) * pageSize);

  return { data, total };
}

export function useModulesQuery(params?: ModuleSearchParams) {
  return useQuery({
    queryKey: [...ADMIN_MODULES_QUERY_KEY, params],
    queryFn: () => {
      const all = MOCK_ADMIN_MODULES.map((m) => normalizeModule(m));
      return applyParams(all, params);
    },
    placeholderData: (prev) => prev,
  });
}
