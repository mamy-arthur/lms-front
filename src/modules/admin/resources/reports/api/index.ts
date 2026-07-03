import { apiGet } from '@/shared/lib/apiClient';
import { Report } from '../types';

interface ReportListResponse {
  items?: Report[];
  data?: Report[];
  total?: number;
}

export const adminReportsApi = {
  list: (params: { page?: number; limit?: number }) =>
    apiGet<ReportListResponse>(`reports?page=${params.page ?? 1}&limit=${params.limit ?? 25}`),
};
