export type { Module } from "@/modules/shared/lib/normalizers";
export { normalizeModule } from "@/modules/shared/lib/normalizers";

export interface CreateModulePayload {
  name: string;
  identifier: string;
  description?: string;
  category: string;
  tenant_id: string;
  course_ids: string[];
}

export interface UpdateModulePayload {
  name: string;
  identifier: string;
  description?: string;
  category: string;
  tenant_id: string;
  course_ids: string[];
}

export interface ModuleSearchParams {
  q?: string;
  category?: string;
  tenant_id?: string;
  sort_by?: string;
  sort_dir?: "asc" | "desc";
  page?: number;
  page_size?: number;
}
