import { useQuery } from "@tanstack/react-query";
import { adminCoursesApi } from "../api";
import { normalizeCourse } from "../types";

export function useCourseQuery(id: string) {
  return useQuery({
    queryKey: ["admin", "courses", id],
    queryFn: async () => {
      const data = await adminCoursesApi.getById(id);
      return normalizeCourse(data as unknown as Record<string, unknown>);
    },
    enabled: !!id,
  });
}
