import { createResourceApi } from '@modules/shared/lib/createResourceApi';
import type { MailTemplate, CreateMailTemplatePayload, UpdateMailTemplatePayload } from '../types';

export const adminMailTemplatesApi = createResourceApi<
  MailTemplate,
  CreateMailTemplatePayload,
  UpdateMailTemplatePayload
>('platform/template-mails');
