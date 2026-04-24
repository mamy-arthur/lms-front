import { registerResourceHandlers } from "@/modules/admin/providers/dataProvider";
import { adminCoursesApi } from "./api";
import { normalizeCourse } from "./types";

registerResourceHandlers("courses", {
  getList: async (_resource, params) => {
    const page: number = params.pagination?.page ?? 1;
    const perPage: number = params.pagination?.perPage ?? 25;
    const { q } = params.filter ?? {};

    const resp = await adminCoursesApi.list({ page, limit: perPage, q });
    const raw = resp.items ?? resp.data ?? [];

    return {
      data: raw.map((c) => normalizeCourse(c as unknown as Record<string, unknown>)),
      total: resp.total ?? raw.length,
    };
  },

  getOne: async (_resource, { id }) => {
    const data = await adminCoursesApi.getById(String(id));
    return { data: normalizeCourse(data as unknown as Record<string, unknown>) };
  },

  create: async (_resource, { data }) => {
    const created = await adminCoursesApi.create(data);
    return { data: normalizeCourse(created as unknown as Record<string, unknown>) };
  },

  update: async (_resource, { id, data }) => {
    const updated = await adminCoursesApi.update(String(id), data);
    return { data: normalizeCourse(updated as unknown as Record<string, unknown>) };
  },

  delete: async (_resource, { id }) => {
    await adminCoursesApi.remove(String(id));
    return { data: { id } as any };
  },
});
