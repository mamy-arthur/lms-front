import { registerResourceHandlers } from "@/modules/admin/providers/dataProvider";
import { adminTraineesApi } from "./api";
import { normalizeTrainee } from "./types";

registerResourceHandlers("trainees", {
  getList: async (_resource, params) => {
    const page: number = params.pagination?.page ?? 1;
    const perPage: number = params.pagination?.perPage ?? 25;
    const { q } = params.filter ?? {};

    const resp = await adminTraineesApi.list({ page, limit: perPage, q });
    const raw = resp.items ?? resp.data ?? [];

    return {
      data: raw.map((t) => normalizeTrainee(t as unknown as Record<string, unknown>)),
      total: resp.total ?? raw.length,
    };
  },

  getOne: async (_resource, { id }) => {
    const data = await adminTraineesApi.getById(String(id));
    return { data: normalizeTrainee(data as unknown as Record<string, unknown>) };
  },
});
