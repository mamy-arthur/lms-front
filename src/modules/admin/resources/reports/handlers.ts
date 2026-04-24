import { registerResourceHandlers } from "@/modules/admin/providers/dataProvider";
import { adminReportsApi } from "./api";

registerResourceHandlers("reports", {
  getList: async (_resource, params) => {
    const page: number = params.pagination?.page ?? 1;
    const perPage: number = params.pagination?.perPage ?? 25;
    const resp = await adminReportsApi.list({ page, limit: perPage });
    const raw = resp.items ?? resp.data ?? [];
    return { data: raw, total: resp.total ?? raw.length };
  },
});
