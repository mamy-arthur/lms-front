import { apiPost } from "@/shared/lib/apiClient";
import type { CreateTenantUserPayload, TenantUser } from "../types";

interface CreateUserResponse {
  data: TenantUser;
}

export const tenantUsersApi = {
  create: (data: CreateTenantUserPayload): Promise<CreateUserResponse> =>
    apiPost<CreateUserResponse>("users", data),
} as const;
