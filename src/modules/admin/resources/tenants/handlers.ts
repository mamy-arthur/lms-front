import { registerResourceHandlers } from "@/modules/admin/providers/dataProvider";
import { adminTenantsApi } from "./api";
import { normalizeTenant } from "./types";

registerResourceHandlers("tenants", {
  getList: async (_resource, params) => {
    const page: number = params.pagination?.page ?? 1;
    const perPage: number = params.pagination?.perPage ?? 25;
    const { q } = params.filter ?? {};

    const resp = await adminTenantsApi.list({ page, limit: perPage, q });
    const raw = resp.items ?? resp.data ?? [];

    return {
      data: raw.map((t) => normalizeTenant(t as unknown as Record<string, unknown>)),
      total: resp.total ?? raw.length,
    };
  },

  getOne: async (_resource, { id }) => {
    const res = await adminTenantsApi.getById(String(id));
    const raw = (res as { data?: unknown }).data ?? res;
    return { data: normalizeTenant(raw as Record<string, unknown>) };
  },

  create: async (_resource, { data }) => {
    const res = await adminTenantsApi.create(data);
    const raw = (res as { data?: unknown }).data ?? res;
    return { data: normalizeTenant(raw as Record<string, unknown>) };
  },

  update: async (_resource, { id, data }) => {
    const res = await adminTenantsApi.update(String(id), data);
    const raw = (res as { data?: unknown }).data ?? res;
    return { data: normalizeTenant(raw as Record<string, unknown>) };
  },

  delete: async (_resource, { id }) => {
    await adminTenantsApi.remove(String(id));
    return { data: { id } as any };
  },
});
