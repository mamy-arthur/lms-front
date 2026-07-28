'use client';

import { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { TENANT_USERS_QUERY_KEY } from '../hooks/useClientUsersQuery';
import { z } from 'zod';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useUserFormDrawer } from '@modules/shared/components/users/use-user-form-drawer';
import { UserForm } from '@modules/shared/components/users/user-form';
import { useTenantStore } from '@/shared/stores/tenant.store';
import { useCreateClientUser } from '../hooks/useCreateClientUsers';
import { useUpdateClientUser } from '../hooks/useUpdateClientUsers';
import type { CreateClientUserPayload, ClientUser, UpdateClientUserPayload } from '../types';
import { Switch } from '@/components/ui/switch';
import { FieldGroup, FieldLabel, FieldRoot } from '@/components/ui/field';
import { UserPhotoField } from '@modules/shared/components/users/user-photo-field';
import { uploadUserProfilePhoto } from '@/modules/shared/lib/uploadUserProfilePhoto';

const passwordSchema = z
  .string()
  .min(8, 'Minimum 8 caractères')
  .regex(/[A-Z]/, 'Au moins une majuscule')
  .regex(/[a-z]/, 'Au moins une minuscule')
  .regex(/[0-9]/, 'Au moins un chiffre')
  .max(255);

const createSchema = z.object({
  first_name: z.string().min(1, 'Prénom requis').max(120),
  last_name: z.string().min(1, 'Nom requis').max(120),
  email: z.string().email('Email invalide').max(255),
  password: passwordSchema,
  role: z.enum(['CLIENT_MANAGER', 'TRAINEE']),
  is_active: z.boolean().default(true),
});

const updateSchema = z.object({
  first_name: z.string().min(1, 'Prénom requis').max(120),
  last_name: z.string().min(1, 'Nom requis').max(120),
  email: z.string().email('Email invalide').max(255),
  role: z.enum(['CLIENT_MANAGER', 'TRAINEE']),
  is_active: z.boolean(),
});

const ROLE_LABELS: Record<string, string> = {
  CLIENT_MANAGER: 'Responsable',
  TRAINEE: 'Stagiaire',
};

const CREATE_DEFAULTS: z.infer<typeof createSchema> = {
  first_name: '',
  last_name: '',
  email: '',
  password: '',
  role: 'TRAINEE',
  is_active: true,
};

export interface UserFormDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  user?: ClientUser;
}

function UserFormDrawerBase({ open, onClose, onSuccess, user }: UserFormDrawerProps) {
  const isEdit = !!user;

  const createMutation = useCreateClientUser();
  const updateMutation = useUpdateClientUser();
  const tenantId = useTenantStore((s) => s.tenant?.id ?? null);
  const pendingPhotoRef = useRef<File | null>(null);
  const queryClient = useQueryClient();

  const schema = isEdit ? updateSchema : createSchema;

  const buildDefaults = useCallback((u?: ClientUser) => {
    if (u) {
      return {
        first_name: u.first_name,
        last_name: u.last_name,
        email: u.email,
        role: u.role as 'CLIENT_MANAGER' | 'TRAINEE',
        is_active: u.is_active,
      };
    }
    return CREATE_DEFAULTS;
  }, []);

  const defaultValues = useMemo(() => buildDefaults(user), [user, buildDefaults]);

  const formState = useUserFormDrawer({
    open,
    onClose,
    onSuccess,
    user,
    createMutation,
    updateMutation,
    schema,
    defaultValues,
    createDefaults: CREATE_DEFAULTS,
    buildCreatePayload: (values) =>
      ({
        first_name: values.first_name,
        last_name: values.last_name,
        email: values.email,
        password: values.password as string,
        role: values.role as CreateClientUserPayload['role'],
        tenant_id: tenantId,
        is_active: values.is_active,
      }) as CreateClientUserPayload,
    buildUpdatePayload: (values, id) => ({
      id,
      data: {
        first_name: values.first_name,
        last_name: values.last_name,
        email: values.email,
        role: values.role as UpdateClientUserPayload['role'],
        is_active: values.is_active,
      } as UpdateClientUserPayload,
    }),
  });

  useEffect(() => {
    if (open) {
      formState.form.reset(defaultValues);
    }
  }, [open, defaultValues, formState.form]);

  // Submit avec upload photo si fichier sélectionné
  const onSubmitWithPhoto = useCallback(
    async (values: Record<string, unknown>) => {
      if (isEdit && user && pendingPhotoRef.current) {
        try {
          const mediaId = await uploadUserProfilePhoto(user.id, pendingPhotoRef.current, 'users');
          await updateMutation.mutateAsync({
            id: user.id,
            data: {
              first_name: values.first_name as string,
              last_name: values.last_name as string,
              email: values.email as string,
              role: values.role as UpdateClientUserPayload['role'],
              is_active: values.is_active as boolean,
              profile_photo_media_id: mediaId,
            } as UpdateClientUserPayload,
          });
          pendingPhotoRef.current = null;
          onSuccess?.();
          onClose();
        } catch {
          /* mutation error handled */
        }
      } else if (!isEdit && pendingPhotoRef.current) {
        // Création : créer d'abord l'utilisateur, puis uploader la photo
        try {
          const res = await createMutation.mutateAsync({
            first_name: values.first_name as string,
            last_name: values.last_name as string,
            email: values.email as string,
            password: values.password as string,
            role: values.role as CreateClientUserPayload['role'],
            tenant_id: tenantId,
            is_active: values.is_active as boolean,
          } as CreateClientUserPayload);
          const newUserId = (res as { data: { id: string } }).data.id;
          await uploadUserProfilePhoto(newUserId, pendingPhotoRef.current, 'users');
          // Invalider après l'upload pour que la photo soit incluse dans le refetch
          await queryClient.invalidateQueries({ queryKey: TENANT_USERS_QUERY_KEY });
          pendingPhotoRef.current = null;
          onSuccess?.();
          onClose();
        } catch {
          /* mutation error handled */
        }
      } else {
        formState.onSubmit(values);
      }
    },
    [isEdit, user, createMutation, updateMutation, formState, onSuccess, onClose, tenantId],
  );

  const activeField = (
    <FieldRoot
      control={formState.form.control}
      name="is_active"
      render={({ field }) => (
        <FieldGroup>
          <div className="flex items-center justify-between">
            <FieldLabel className="text-xs">Compte actif</FieldLabel>
            <Switch
              checked={field.value}
              onCheckedChange={field.onChange}
              aria-label="Compte actif"
            />
          </div>
        </FieldGroup>
      )}
    />
  );

  return (
    <Sheet open={open} onOpenChange={(nextOpen) => !nextOpen && formState.handleClose()}>
      <SheetContent
        className="flex w-full flex-col gap-0 p-0 sm:max-w-2xl lg:max-w-4xl"
        showCloseButton={true}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <SheetHeader className="border-b px-4 py-4">
          <SheetTitle>{isEdit ? "Modifier l'utilisateur" : 'Créer un utilisateur'}</SheetTitle>
          <SheetDescription>Renseignez les informations de l'utilisateur.</SheetDescription>
        </SheetHeader>
        <UserForm
          form={formState.form}
          mutation={formState.mutation}
          isEdit={formState.isEdit}
          handleClose={formState.handleClose}
          onSubmit={onSubmitWithPhoto}
          showPassword={formState.showPassword}
          togglePasswordVisibility={formState.togglePasswordVisibility}
          roleLabels={ROLE_LABELS}
          extraFields={
            <>
              <UserPhotoField
                currentPhotoUrl={user?.profile_photo?.url ?? null}
                fullName={user ? `${user.first_name} ${user.last_name}` : ''}
                onFileSelected={(file) => {
                  pendingPhotoRef.current = file;
                }}
              />
              {activeField}
            </>
          }
        />
      </SheetContent>
    </Sheet>
  );
}

export const UserFormDrawer = memo(UserFormDrawerBase);
