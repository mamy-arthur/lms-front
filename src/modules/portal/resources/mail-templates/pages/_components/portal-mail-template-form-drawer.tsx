'use client';

import { memo } from 'react';
import { MailTemplateFormDrawer } from '@modules/shared/components/mail-templates/MailTemplateFormDrawer';
import { useCreatePortalMailTemplate } from '../../hooks/useCreatePortalMailTemplate';
import { useUpdatePortalMailTemplate } from '../../hooks/useUpdatePortalMailTemplate';
import { useUploadPortalMailTemplateMedia } from '../../hooks/useUploadPortalMailTemplateMedia';
import type { MailTemplate } from '../../types';

export interface PortalMailTemplateFormDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  template?: MailTemplate;
}

function PortalMailTemplateFormDrawerBase(props: PortalMailTemplateFormDrawerProps) {
  const createMutation = useCreatePortalMailTemplate();
  const updateMutation = useUpdatePortalMailTemplate();
  const uploadMedia = useUploadPortalMailTemplateMedia();

  return (
    <MailTemplateFormDrawer
      {...props}
      createMutation={createMutation}
      updateMutation={updateMutation}
      uploadMedia={uploadMedia}
      variablesApiPath="template-variables"
    />
  );
}

export const PortalMailTemplateFormDrawer = memo(PortalMailTemplateFormDrawerBase);
