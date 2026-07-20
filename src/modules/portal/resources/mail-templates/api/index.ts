import { createResourceApi } from '@modules/shared/lib/createResourceApi';
import type { MailTemplate, CreateMailTemplatePayload, UpdateMailTemplatePayload } from '../types';

export const portalMailTemplatesApi = createResourceApi<
  MailTemplate,
  CreateMailTemplatePayload,
  UpdateMailTemplatePayload
>('template-mails');
