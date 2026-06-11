import { useQuery } from "@tanstack/react-query";
import { adminCoursesApi } from "../api";

export function useCourseQuery(id: string) {
    return useQuery({
        queryKey: ["admin", "courses", id],
        queryFn: async () => {
            const data = await adminCoursesApi.getById(id);
            return [];
        },
        enabled: !!id,
    });
}
