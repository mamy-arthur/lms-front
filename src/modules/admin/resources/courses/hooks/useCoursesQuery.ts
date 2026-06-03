import { useQuery } from "@tanstack/react-query";
import { adminCoursesApi } from "../api";
import { normalizeCourse } from "../types";

interface Params {
  page: number;
  perPage: number;
  q?: string;
}

export function useCoursesQuery({ page, perPage, q }: Params) {
  return useQuery({
    queryKey: ["admin", "courses", { page, perPage, q }],
    queryFn: async () => {
      const resp = await adminCoursesApi.list({ page, limit: perPage, q });
      const raw = resp.items ?? resp.data ?? [];
      return {
        data: raw.map((c) => normalizeCourse(c as unknown as Record<string, unknown>)),
        total: resp.total ?? raw.length,
      };
    },
  });
}
