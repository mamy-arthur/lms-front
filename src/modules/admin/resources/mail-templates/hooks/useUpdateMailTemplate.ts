import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminMailTemplatesApi } from '../api';
import type { UpdateMailTemplatePayload } from '../types';
import { ADMIN_MAIL_TEMPLATES_QUERY_KEY } from './useMailTemplatesQuery';

export function useUpdateMailTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMailTemplatePayload }) =>
      adminMailTemplatesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ADMIN_MAIL_TEMPLATES_QUERY_KEY,
      });
    },
  });
}
