import { useQuery } from '@tanstack/react-query';
import { portalMailTemplatesApi } from '../api';
import type { MailTemplateSearchParams } from '../types';
import { normalizeMailTemplate } from '../types';

export const PORTAL_MAIL_TEMPLATES_QUERY_KEY = ['portal', 'mail-templates'] as const;

export function usePortalMailTemplatesQuery(params?: MailTemplateSearchParams) {
  return useQuery({
    queryKey: [...PORTAL_MAIL_TEMPLATES_QUERY_KEY, params],
    queryFn: async () => {
      const { category, ...rest } = params ?? {};
      const apiParams: Record<string, unknown> = {
        ...rest,
        ...(category !== undefined ? { status: category } : {}),
      };
      const response = await portalMailTemplatesApi.list(apiParams);
      const raw = response.data ?? [];
      const data = raw.map((m) => normalizeMailTemplate(m));
      return { data, total: response.total ?? data.length };
    },
    placeholderData: (prev) => prev,
  });
}
