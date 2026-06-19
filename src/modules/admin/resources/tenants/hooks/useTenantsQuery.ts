import { useQuery } from "@tanstack/react-query";
import { adminTenantsApi } from "../api";
import { normalizeTenant } from "../types";

interface Params {
  page: number;
  perPage: number;
  q?: string;
}

export function useTenantsQuery({ page, perPage, q }: Params) {
  return useQuery({
    queryKey: ["admin", "tenants", { page, perPage, q }],
    queryFn: async () => {
      const resp = await adminTenantsApi.list({ page, limit: perPage, q });
      const raw = resp.items ?? resp.data ?? [];
      return {
        data: raw.map((t) => normalizeTenant(t as unknown as Record<string, unknown>)),
        total: resp.total ?? raw.length,
      };
    },
  });
}
