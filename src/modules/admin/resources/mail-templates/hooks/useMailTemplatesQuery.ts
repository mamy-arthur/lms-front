import { useQuery } from "@tanstack/react-query";
import { MOCK_MAIL_TEMPLATES } from "@modules/shared/components/mail-templates/mocks/mail-templates.mock";
import type { MailTemplateSearchParams } from "../types";
import { normalizeMailTemplate } from "../types";

export const ADMIN_MAIL_TEMPLATES_QUERY_KEY = [
  "admin",
  "mail-templates",
] as const;

export function useMailTemplatesQuery(params?: MailTemplateSearchParams) {
  return useQuery({
    queryKey: [...ADMIN_MAIL_TEMPLATES_QUERY_KEY, params],
    queryFn: () => {
      const data = MOCK_MAIL_TEMPLATES.map((m) => normalizeMailTemplate(m));
      return { data, total: data.length };
    },
    placeholderData: (prev) => prev,
  });
}
