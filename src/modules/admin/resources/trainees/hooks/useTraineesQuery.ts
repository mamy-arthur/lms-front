import { useQuery } from "@tanstack/react-query";
import { adminTraineesApi } from "../api";
import { normalizeTrainee } from "../types";

interface Params {
  page: number;
  perPage: number;
  q?: string;
}

export function useTraineesQuery({ page, perPage, q }: Params) {
  return useQuery({
    queryKey: ["admin", "trainees", { page, perPage, q }],
    queryFn: async () => {
      const resp = await adminTraineesApi.list({ page, limit: perPage, q });
      const raw = resp.items ?? resp.data ?? [];
      return {
        data: raw.map((t) => normalizeTrainee(t as unknown as Record<string, unknown>)),
        total: resp.total ?? raw.length,
      };
    },
  });
}
