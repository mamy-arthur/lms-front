import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateMailTemplatePayload } from "../types";
import { ADMIN_MAIL_TEMPLATES_QUERY_KEY } from "./useMailTemplatesQuery";

export function useCreateMailTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateMailTemplatePayload) => {
      const mockRaw: Record<string, unknown> = {
        id: `mail-${Date.now()}`,
        name: data.name,
        subject: data.subject,
        is_active: data.is_active ?? true,
        body: data.body ?? "",
        tenant_id: data.tenant_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      return Promise.resolve({ data: mockRaw });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ADMIN_MAIL_TEMPLATES_QUERY_KEY,
      });
    },
  });
}
