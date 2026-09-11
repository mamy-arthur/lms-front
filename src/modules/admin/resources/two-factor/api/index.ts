import { apiGet, apiPut } from '@/shared/lib/apiClient';
import type { TenantTemplateMail, TwoFactorSettings, TwoFactorSettingsPayload } from '../types';

export const twoFactorApi = {
  getGlobal: () => apiGet<{ data: TwoFactorSettings }>('platform/two-factor-settings'),

  updateGlobal: (payload: TwoFactorSettingsPayload) =>
    apiPut<{ data: TwoFactorSettings }>('platform/two-factor-settings', payload),

  getForTenant: (tenantId: string) =>
    apiGet<{ data: TwoFactorSettings }>(`platform/tenants/${tenantId}/two-factor-settings`),

  updateForTenant: (tenantId: string, payload: TwoFactorSettingsPayload) =>
    apiPut<{ data: TwoFactorSettings }>(
      `platform/tenants/${tenantId}/two-factor-settings`,
      payload,
    ),

  /**
   * Templates d'un tenant précis. `platform/template-mails` reste scopé au
   * contexte courant, nul sur le domaine central : cet endpoint dédié prend le
   * tenant dans l'URL.
   */
  getTenantTemplateMails: (tenantId: string) =>
    apiGet<{ data: TenantTemplateMail[] }>(`platform/tenants/${tenantId}/template-mails`),
};
