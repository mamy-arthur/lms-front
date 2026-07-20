'use client';

import { memo } from 'react';
import { MailTemplateFormDrawer } from '@modules/shared/components/mail-templates/MailTemplateFormDrawer';
import { useCreateMailTemplate } from '../../hooks/useCreateMailTemplate';
import { useUpdateMailTemplate } from '../../hooks/useUpdateMailTemplate';
import { useUploadMailTemplateMedia } from '../../hooks/useUploadMailTemplateMedia';
import type { MailTemplate } from '../../types';

export interface AdminMailTemplateFormDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  template?: MailTemplate;
}

function AdminMailTemplateFormDrawerBase(props: AdminMailTemplateFormDrawerProps) {
  const createMutation = useCreateMailTemplate();
  const updateMutation = useUpdateMailTemplate();
  const uploadMedia = useUploadMailTemplateMedia();

  return (
    <MailTemplateFormDrawer
      {...props}
      createMutation={createMutation}
      updateMutation={updateMutation}
      uploadMedia={uploadMedia}
      variablesApiPath="platform/template-variables"
    />
  );
}

export const AdminMailTemplateFormDrawer = memo(AdminMailTemplateFormDrawerBase);
