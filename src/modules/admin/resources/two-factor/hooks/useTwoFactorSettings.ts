import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { getApiErrorMessage } from '@/shared/lib/errors';
import { twoFactorApi } from '../api';
import type { TwoFactorSettingsPayload } from '../types';

export const TWO_FACTOR_SETTINGS_QUERY_KEY = ['two-factor-settings'] as const;

export function useGlobalTwoFactorSettings() {
  return useQuery({
    queryKey: [...TWO_FACTOR_SETTINGS_QUERY_KEY, 'global'],
    queryFn: () => twoFactorApi.getGlobal(),
  });
}

export function useTenantTwoFactorSettings(tenantId: string | null) {
  return useQuery({
    queryKey: [...TWO_FACTOR_SETTINGS_QUERY_KEY, 'tenant', tenantId],
    queryFn: () => twoFactorApi.getForTenant(tenantId as string),
    enabled: tenantId !== null,
  });
}

export function useTenantTemplateMails(tenantId: string | null) {
  return useQuery({
    queryKey: ['tenant-template-mails', tenantId],
    queryFn: () => twoFactorApi.getTenantTemplateMails(tenantId as string),
    enabled: tenantId !== null,
  });
}

export function useUpdateGlobalTwoFactorSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: TwoFactorSettingsPayload) => twoFactorApi.updateGlobal(payload),
    onSuccess: () => {
      // Les surcharges tenant héritent du global : les deux niveaux sont invalidés.
      queryClient.invalidateQueries({ queryKey: TWO_FACTOR_SETTINGS_QUERY_KEY });
      toast.success('Paramètres 2FA globaux mis à jour');
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, 'Échec de la mise à jour des paramètres 2FA')),
  });
}

export function useUpdateTenantTwoFactorSettings(tenantId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: TwoFactorSettingsPayload) =>
      twoFactorApi.updateForTenant(tenantId as string, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TWO_FACTOR_SETTINGS_QUERY_KEY });
      toast.success('Paramètres 2FA du tenant mis à jour');
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, 'Échec de la mise à jour des paramètres 2FA')),
  });
}
