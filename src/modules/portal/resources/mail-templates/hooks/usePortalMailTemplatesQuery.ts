import { useQuery } from '@tanstack/react-query';
import { portalMailTemplatesApi } from '../api';
import type { MailTemplateSearchParams } from '../types';
import { normalizeMailTemplate } from '../types';
import { buildResourceQueryParams } from '@/lib/buildResourceQueryParams';

export const PORTAL_MAIL_TEMPLATES_QUERY_KEY = ['portal', 'mail-templates'] as const;

export function usePortalMailTemplatesQuery(params?: MailTemplateSearchParams) {
  return useQuery({
    queryKey: [...PORTAL_MAIL_TEMPLATES_QUERY_KEY, params],
    queryFn: async () => {
      const response = await portalMailTemplatesApi.list(
        buildResourceQueryParams(params as Record<string, unknown>),
      );
      const raw = response.data ?? [];
      const data = raw.map((m) => normalizeMailTemplate(m));
      return { data, total: response.total ?? data.length };
    },
    placeholderData: (prev) => prev,
  });
}
