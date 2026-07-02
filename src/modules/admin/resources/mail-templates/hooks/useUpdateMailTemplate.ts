import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UpdateMailTemplatePayload } from "../types";
import { ADMIN_MAIL_TEMPLATES_QUERY_KEY } from "./useMailTemplatesQuery";

export function useUpdateMailTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateMailTemplatePayload;
    }) => {
      const mockRaw: Record<string, unknown> = {
        id,
        name: data.name,
        subject: data.subject,
        is_active: data.is_active,
        body: data.body ?? "",
        tenant_id: data.tenant_id,
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
