import { registerResourceHandlers } from "@/modules/admin/providers/dataProvider";
import { adminUsersApi } from "./api";
import { normalizeUser } from "./types";

registerResourceHandlers("users", {
  getList: async (_resource, params) => {
    const page: number = params.pagination?.page ?? 1;
    const perPage: number = params.pagination?.perPage ?? 25;
    const { q } = params.filter ?? {};

    const resp = await adminUsersApi.list({ page, limit: perPage, q });
    const raw = resp.items ?? resp.data ?? [];

    return {
      data: raw.map((u) => normalizeUser(u as unknown as Record<string, unknown>)),
      total: resp.total ?? raw.length,
    };
  },

  getOne: async (_resource, { id }) => {
    const data = await adminUsersApi.getById(String(id));
    return { data: normalizeUser(data as unknown as Record<string, unknown>) };
  },

  create: async (_resource, { data }) => {
    const res = await adminUsersApi.create(data);
    const raw = (res as { data?: unknown }).data ?? res;
    return { data: normalizeUser(raw as Record<string, unknown>) };
  },

  update: async (_resource, { id, data }) => {
    const res = await adminUsersApi.update(String(id), data);
    const raw = (res as { data?: unknown }).data ?? res;
    return { data: normalizeUser(raw as Record<string, unknown>) };
  },

  delete: async (_resource, { id }) => {
    await adminUsersApi.remove(String(id));
    return { data: { id } as any };
  },
});
