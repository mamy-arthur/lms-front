'use client';

import { memo, useMemo } from 'react';
import { z } from 'zod';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useFormDrawer } from '@/shared/components/form-drawer/use-form-drawer';
import { MailTemplateForm } from '@modules/shared/components/mail-templates/mail-template-form';
import { makeMailTemplateToolbarExtras } from '@modules/shared/components/mail-templates/mail-template-toolbar-extras';
import { useCreateMailTemplate } from '../../hooks/useCreateMailTemplate';
import { useUpdateMailTemplate } from '../../hooks/useUpdateMailTemplate';
import type {
  MailTemplate,
  CreateMailTemplatePayload,
  UpdateMailTemplatePayload,
} from '../../types';

const baseSchema = {
  name: z.string().min(1, 'Nom requis').max(255),
  subject: z.string().min(1, 'Sujet requis').max(255),
  isActive: z.boolean(),
  body: z.string().min(1, 'Corps requis'),
};

const createSchema = z.object(baseSchema);

type FormValues = z.infer<typeof createSchema>;

const CREATE_DEFAULTS: FormValues = {
  name: '',
  subject: '',
  isActive: true,
  body: '',
};

export interface AdminMailTemplateFormDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  template?: MailTemplate;
}

function AdminMailTemplateFormDrawerBase({
  open,
  onClose,
  onSuccess,
  template,
}: AdminMailTemplateFormDrawerProps) {
  const isEdit = !!template;
  const createMutation = useCreateMailTemplate();
  const updateMutation = useUpdateMailTemplate();

  const toolbarExtras = useMemo(
    () => makeMailTemplateToolbarExtras('platform/template-variables'),
    [],
  );

  const schema = createSchema;

  const defaultValues = useMemo<FormValues>(() => {
    if (template) {
      return {
        name: template.name,
        subject: template.subject,
        isActive: template.isActive,
        body: template.body,
      };
    }
    return CREATE_DEFAULTS;
  }, [template]);

  const formState = useFormDrawer({
    open,
    onClose,
    onSuccess,
    entity: template,
    createMutation,
    updateMutation,
    schema,
    defaultValues,
    createDefaults: CREATE_DEFAULTS,
    buildCreatePayload: (values): CreateMailTemplatePayload => ({
      name: values.name,
      subject: values.subject,
      status: values.isActive,
      body: values.body,
    }),
    buildUpdatePayload: (values, id): { id: string; data: UpdateMailTemplatePayload } => ({
      id,
      data: {
        name: values.name,
        subject: values.subject,
        status: values.isActive,
        body: values.body,
      },
    }),
  });

  return (
    <Sheet open={open} onOpenChange={(nextOpen) => !nextOpen && formState.handleClose()}>
      <SheetContent
        className="flex w-full flex-col gap-0 p-0 sm:max-w-150! lg:max-w-200!"
        showCloseButton={true}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <SheetHeader className="border-b px-4 py-4">
          <SheetTitle>
            {isEdit ? 'Modifier le template mail' : 'Ajouter un template mail'}
          </SheetTitle>
          <SheetDescription>Renseignez les informations du template mail.</SheetDescription>
        </SheetHeader>
        <MailTemplateForm
          form={formState.form}
          mutation={formState.mutation}
          isEdit={formState.isEdit}
          handleClose={formState.handleClose}
          onSubmit={formState.onSubmit}
          toolbarExtras={toolbarExtras}
          reference={template?.reference}
        />
      </SheetContent>
    </Sheet>
  );
}

export const AdminMailTemplateFormDrawer = memo(AdminMailTemplateFormDrawerBase);
