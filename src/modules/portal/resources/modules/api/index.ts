import { apiPost, apiPut } from "@/shared/lib/apiClient";
import type {
  CreateModulePayload,
  Module,
  UpdateModulePayload,
} from "../types";

interface CreateModuleResponse {
  data: Module;
}

export const modulesApi = {
  create: (data: CreateModulePayload): Promise<CreateModuleResponse> =>
    apiPost<CreateModuleResponse>("modules", data),

  update: (
    id: string,
    data: UpdateModulePayload,
  ): Promise<{ data: Module }> =>
    apiPut<{ data: Module }>(`modules/${id}`, data),
} as const;
