'use client';

import { memo, useCallback, useMemo } from 'react';
import { z } from 'zod';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useFormDrawer } from '@/shared/components/form-drawer/use-form-drawer';
import { makeCertificateToolbarExtras } from '@modules/shared/components/certificates/certificate-toolbar-extras';
import { CertificateForm } from '@modules/shared/components/certificates/certificate-form';
import { useTenant } from '@/shared/hooks/useTenant';
import { useCreateCertificate } from '../../hooks/useCreateCertificate';
import { useUpdateCertificate } from '../../hooks/useUpdateCertificate';
import { useUploadCertificateMedia } from '../../hooks/useUploadCertificateMedia';
import type { Certificate, CreateCertificatePayload, UpdateCertificatePayload } from '../../types';

const baseSchema = {
  name: z.string().min(1, 'Nom requis').max(255),
  isActive: z.boolean(),
  isDefaultTemplate: z.boolean(),
  body: z.string().min(1, 'Corps requis'),
};

const createSchema = z.object(baseSchema);

type FormValues = z.infer<typeof createSchema>;

const CREATE_DEFAULTS: FormValues = {
  name: '',
  isActive: true,
  isDefaultTemplate: false,
  body: '',
};

export interface AdminCertificateFormDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  certificate?: Certificate;
}

function AdminCertificateFormDrawerBase({
  open,
  onClose,
  onSuccess,
  certificate,
}: AdminCertificateFormDrawerProps) {
  const isEdit = !!certificate;
  const { tenant, isLoading: isTenantLoading } = useTenant();

  const createMutation = useCreateCertificate();
  const updateMutation = useUpdateCertificate();
  const uploadMedia = useUploadCertificateMedia();

  const uploadFn = useCallback(
    async (file: File) => {
      const { data } = await uploadMedia.mutateAsync(file);
      return { mediaId: data.id, src: data.url };
    },
    [uploadMedia.mutateAsync],
  );

  const toolbarExtras = useMemo(
    () =>
      makeCertificateToolbarExtras({
        uploadMedia: uploadFn,
        apiPath: 'platform/template-variables',
      }),
    [uploadFn],
  );

  const schema = createSchema;

  const defaultValues = useMemo<FormValues>(() => {
    if (certificate) {
      return {
        name: certificate.name,
        isActive: certificate.isActive,
        isDefaultTemplate: certificate.isDefaultTemplate,
        body: certificate.body,
      };
    }
    return CREATE_DEFAULTS;
  }, [certificate]);

  // Bloque la soumission tant que le tenant n'est pas résolu
  const pendingMutation = isTenantLoading
    ? { ...createMutation, isPending: true as const }
    : createMutation;
  const pendingUpdateMutation = isTenantLoading
    ? { ...updateMutation, isPending: true as const }
    : updateMutation;

  const formState = useFormDrawer({
    open,
    onClose,
    onSuccess,
    entity: certificate,
    createMutation: pendingMutation,
    updateMutation: pendingUpdateMutation,
    schema,
    defaultValues,
    createDefaults: CREATE_DEFAULTS,
    buildCreatePayload: (values): CreateCertificatePayload => ({
      name: values.name,
      status: Boolean(values.isActive),
      setasdefault: Boolean(values.isDefaultTemplate),
      body: values.body,
      tenant_id: tenant!.id,
    }),
    buildUpdatePayload: (values, id): { id: string; data: UpdateCertificatePayload } => ({
      id,
      data: {
        name: values.name,
        status: Boolean(values.isActive),
        setasdefault: Boolean(values.isDefaultTemplate),
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
          <SheetTitle>{isEdit ? "Modifier l'attestation" : 'Ajouter une attestation'}</SheetTitle>
          <SheetDescription>Renseignez les informations du modèle d'attestation.</SheetDescription>
        </SheetHeader>
        <CertificateForm
          form={formState.form}
          mutation={formState.mutation}
          isEdit={formState.isEdit}
          handleClose={formState.handleClose}
          onSubmit={formState.onSubmit}
          toolbarExtras={toolbarExtras}
          reference={certificate?.reference}
        />
      </SheetContent>
    </Sheet>
  );
}

export const AdminCertificateFormDrawer = memo(AdminCertificateFormDrawerBase);
