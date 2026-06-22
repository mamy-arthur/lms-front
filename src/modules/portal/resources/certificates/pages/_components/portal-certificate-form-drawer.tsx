"use client";

import { memo, useMemo } from "react";
import { z } from "zod";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldRoot,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFormDrawer } from "@/shared/components/form-drawer/use-form-drawer";
import { CertificateForm } from "@modules/shared/components/certificates/certificate-form";
import { certificateToolbarExtras } from "@modules/shared/components/certificates/certificate-toolbar-extras";
import type { Tenant } from "@/shared/types/tenant.types";
import { useCreatePortalCertificate } from "../../hooks/useCreatePortalCertificate";
import { useUpdatePortalCertificate } from "../../hooks/useUpdatePortalCertificate";
import type {
  Certificate,
  CreateCertificatePayload,
  UpdateCertificatePayload,
} from "../../types";

const baseSchema = {
  name: z.string().min(1, "Nom requis").max(255),
  isActive: z.boolean(),
  isDefaultTemplate: z.boolean(),
  body: z.string().min(1, "Corps requis"),
  tenantId: z.string().min(1, "Tenant requis"),
};

const createSchema = z.object(baseSchema);
const updateSchema = z.object(baseSchema);

type FormValues = z.infer<typeof createSchema>;

const CREATE_DEFAULTS: FormValues = {
  name: "",
  isActive: true,
  isDefaultTemplate: false,
  body: "",
  tenantId: "",
};

export interface PortalCertificateFormDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  certificate?: Certificate;
  tenants: Tenant[];
}

function PortalCertificateFormDrawerBase({
  open,
  onClose,
  onSuccess,
  certificate,
  tenants,
}: PortalCertificateFormDrawerProps) {
  const isEdit = !!certificate;

  const createMutation = useCreatePortalCertificate();
  const updateMutation = useUpdatePortalCertificate();

  const schema = isEdit ? updateSchema : createSchema;

  const defaultValues = useMemo<FormValues>(() => {
    if (certificate) {
      return {
        name: certificate.name,
        isActive: certificate.isActive,
        isDefaultTemplate: certificate.isDefaultTemplate,
        body: certificate.body,
        tenantId: certificate.tenantId,
      };
    }
    return CREATE_DEFAULTS;
  }, [certificate]);

  const formState = useFormDrawer({
    open,
    onClose,
    onSuccess,
    entity: certificate,
    createMutation,
    updateMutation,
    schema,
    defaultValues,
    createDefaults: CREATE_DEFAULTS,
    buildCreatePayload: (values): CreateCertificatePayload => ({
      name: values.name,
      is_active: values.isActive,
      is_default_template: values.isDefaultTemplate,
      body: values.body,
      tenant_id: values.tenantId,
    }),
    buildUpdatePayload: (
      values,
      id,
    ): { id: string; data: UpdateCertificatePayload } => ({
      id,
      data: {
        name: values.name,
        is_active: values.isActive,
        is_default_template: values.isDefaultTemplate,
        body: values.body,
        tenant_id: values.tenantId,
      },
    }),
  });

  const tenantField = (
    <FieldRoot
      control={formState.form.control as any}
      name="tenantId"
      render={({ field }) => (
        <FieldGroup>
          <FieldLabel className="text-xs">Tenant *</FieldLabel>
          <Select
            onValueChange={field.onChange}
            defaultValue={field.value}
            value={field.value}
          >
            <FieldContent>
              <SelectTrigger
                size="default"
                aria-label="Tenant"
                className="w-full"
              >
                <SelectValue placeholder="Sélectionner un tenant" />
              </SelectTrigger>
            </FieldContent>
            <SelectContent>
              {tenants.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError />
        </FieldGroup>
      )}
    />
  );

  return (
    <Sheet
      open={open}
      onOpenChange={(nextOpen) => !nextOpen && formState.handleClose()}
    >
      <SheetContent
        className="flex w-full flex-col gap-0 p-0 sm:max-w-2xl lg:max-w-4xl"
        showCloseButton={true}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <SheetHeader className="border-b px-4 py-4">
          <SheetTitle>
            {isEdit ? "Modifier l'attestation" : "Ajouter une attestation"}
          </SheetTitle>
          <SheetDescription>
            Renseignez les informations du modèle d'attestation.
          </SheetDescription>
        </SheetHeader>
        <CertificateForm
          form={formState.form}
          mutation={formState.mutation}
          isEdit={formState.isEdit}
          handleClose={formState.handleClose}
          onSubmit={formState.onSubmit}
          extraFields={tenantField}
          toolbarExtras={certificateToolbarExtras}
        />
      </SheetContent>
    </Sheet>
  );
}

export const PortalCertificateFormDrawer = memo(
  PortalCertificateFormDrawerBase,
);
