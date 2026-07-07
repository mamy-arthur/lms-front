import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UpdateMailTemplatePayload } from '../types';
import { PORTAL_MAIL_TEMPLATES_QUERY_KEY } from './usePortalMailTemplatesQuery';

export function useUpdatePortalMailTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMailTemplatePayload }) => {
      const mockRaw: Record<string, unknown> = {
        id,
        name: data.name,
        subject: data.subject,
        is_active: data.is_active,
        body: data.body ?? '',
        tenant_id: data.tenant_id,
        updated_at: new Date().toISOString(),
      };
      return Promise.resolve({ data: mockRaw });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: PORTAL_MAIL_TEMPLATES_QUERY_KEY,
      });
    },
  });
}
