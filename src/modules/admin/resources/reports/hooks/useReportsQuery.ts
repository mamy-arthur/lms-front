import { useQuery } from "@tanstack/react-query";
import { adminReportsApi } from "../api";

interface Params {
  page: number;
  perPage: number;
}

export function useReportsQuery({ page, perPage }: Params) {
  return useQuery({
    queryKey: ["admin", "reports", { page, perPage }],
    queryFn: async () => {
      const resp = await adminReportsApi.list({ page, limit: perPage });
      const raw = resp.items ?? resp.data ?? [];
      return {
        data: raw,
        total: resp.total ?? raw.length,
      };
    },
  });
}
