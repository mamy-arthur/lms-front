import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tenantApi } from '../api';
import { CreateTenantPayload, UpdateTenantPayload } from '@/shared/types/tenants/tenant';

export const useTenants = () => {
  return useQuery({
    queryKey: ['tenants'],
    queryFn: () => tenantApi.getAll(),
  });
};

export const useCreateTenant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: tenantApi.create,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['tenants'],
      });
    },
  });
};

export const useUpdateTenant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTenantPayload }) =>
      tenantApi.update(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['tenants'],
      });
    },
  });
};

export const useDeleteTenant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: tenantApi.remove,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['tenants'],
      });
    },
  });
};
