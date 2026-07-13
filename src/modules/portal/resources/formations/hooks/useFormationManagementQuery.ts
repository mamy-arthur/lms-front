import { useQuery } from '@tanstack/react-query';
import { ClientFormationManagementApi } from '../api';
import type { FormationManagementQueryResult } from '../types';

export const CLIENT_FORMATIONS_QUERY_KEY = ['tenant', 'formations-management'] as const;

export function useFormationManagementQuery(tenantId?: string) {
  return useQuery<FormationManagementQueryResult>({
    queryKey: [...CLIENT_FORMATIONS_QUERY_KEY, tenantId],
    queryFn: () => ClientFormationManagementApi.getAll(),
    placeholderData: (prev) => prev,
  });
}
