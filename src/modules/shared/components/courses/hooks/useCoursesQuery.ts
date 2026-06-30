import { useQuery } from "@tanstack/react-query";
import { adminCoursesApi } from "../../../../admin/resources/courses/api";

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
        data: raw,
        total: resp.total ?? raw.length,
      };
    },
  });
}
