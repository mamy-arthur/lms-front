import { apiGet, apiPost } from "@/shared/lib/apiClient";
import type {
  ApiEnrollmentsListResponse,
  CreateEnrollmentPayload,
  CreateEnrollmentResponse,
  EnrollmentsListParams,
} from "@/shared/types/enrollment.types";

/**
 * Enrollments CM — routes /enrollments
 * Authentification : token tenant (Gate client manager)
 */
export const enrollmentsApi = {
  list: (params?: EnrollmentsListParams) =>
    apiGet<ApiEnrollmentsListResponse>(
      "enrollments",
      params as Record<string, unknown>,
    ),

  create: (data: CreateEnrollmentPayload) =>
    apiPost<CreateEnrollmentResponse>("enrollments", data),
};
