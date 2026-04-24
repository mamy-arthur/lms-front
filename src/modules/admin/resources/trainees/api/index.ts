import { apiGet } from "@/shared/lib/apiClient";
import { Trainee } from "../types";

interface TraineeListResponse {
  items?: Trainee[];
  data?: Trainee[];
  total?: number;
}

export const adminTraineesApi = {
  list: (params: { page?: number; limit?: number; q?: string }) =>
    apiGet<TraineeListResponse>(
      `trainees?page=${params.page ?? 1}&limit=${params.limit ?? 25}${params.q ? `&q=${params.q}` : ""}`
    ),

  getById: (id: string) => apiGet<Trainee>(`trainees/${id}`),
};
