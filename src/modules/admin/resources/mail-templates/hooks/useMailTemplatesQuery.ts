import { useQuery } from '@tanstack/react-query';
import { adminMailTemplatesApi } from '../api';
import type { MailTemplateSearchParams } from '../types';
import { normalizeMailTemplate } from '../types';
import { buildResourceQueryParams } from '@/lib/buildResourceQueryParams';

export const ADMIN_MAIL_TEMPLATES_QUERY_KEY = ['admin', 'mail-templates'] as const;

export function useMailTemplatesQuery(params?: MailTemplateSearchParams) {
  return useQuery({
    queryKey: [...ADMIN_MAIL_TEMPLATES_QUERY_KEY, params],
    queryFn: async () => {
      const response = await adminMailTemplatesApi.list(
        buildResourceQueryParams(params as Record<string, unknown>),
      );
      const raw = response.data ?? [];
      const data = raw.map((m) => normalizeMailTemplate(m));
      return { data, total: response.total ?? data.length };
    },
    placeholderData: (prev) => prev,
  });
}
