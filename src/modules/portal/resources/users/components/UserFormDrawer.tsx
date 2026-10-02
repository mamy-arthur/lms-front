'use client';

import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
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
import { useTenant } from '@/shared/hooks/useTenant';
import { useCreateClientUser } from '../hooks/useCreateClientUsers';
import { useUpdateClientUser } from '../hooks/useUpdateClientUsers';
import type { CreateClientUserPayload, ClientUser, UpdateClientUserPayload } from '../types';
import { Switch } from '@/components/ui/switch';
import { FieldGroup, FieldLabel, FieldRoot } from '@/components/ui/field';
import { UserPhotoField } from '@modules/shared/components/users/user-photo-field';
import { UserProfileFields } from '@modules/shared/components/users/user-profile-fields';
import { uploadUserProfilePhoto } from '@/modules/shared/lib/uploadUserProfilePhoto';

const passwordSchema = z
  .string()
  .min(8, 'Minimum 8 caractères')
  .regex(/[A-Z]/, 'Au moins une majuscule')
  .regex(/[a-z]/, 'Au moins une minuscule')
  .regex(/[0-9]/, 'Au moins un chiffre')
  .max(255);

const profileFieldsSchema = z.object({
  address: z.string().max(255).nullable().optional(),
  zip_code: z.string().max(20).nullable().optional(),
  city: z.string().max(100).nullable().optional(),
  country: z.string().length(2).nullable().optional(),
  timezone: z.string().nullable().optional(),
  preferred_language: z.string().nullable().optional(),
});

const createSchema = z
  .object({
    first_name: z.string().min(1, 'Prénom requis').max(120),
    last_name: z.string().min(1, 'Nom requis').max(120),
    email: z.string().email('Email invalide').max(255),
    password: passwordSchema,
    role: z.enum(['CLIENT_MANAGER', 'TRAINEE']),
    is_active: z.boolean().default(true),
  })
  .merge(profileFieldsSchema);

const updateSchema = z
  .object({
    first_name: z.string().min(1, 'Prénom requis').max(120),
    last_name: z.string().min(1, 'Nom requis').max(120),
    email: z.string().email('Email invalide').max(255),
    role: z.enum(['CLIENT_MANAGER', 'TRAINEE']),
    is_active: z.boolean(),
  })
  .merge(profileFieldsSchema);

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
  address: null,
  zip_code: null,
  city: null,
  country: null,
  timezone: null,
  preferred_language: null,
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
  const { tenant } = useTenant();
  const tenantId = tenant?.id ?? null;
  const pendingPhotoRef = useRef<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Ref et non state : deux clics dans le meme tick liraient la meme valeur.
  const submittingRef = useRef(false);
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
        address: u.address ?? null,
        zip_code: u.zip_code ?? null,
        city: u.city ?? null,
        country: u.country ?? null,
        timezone: u.timezone ?? null,
        preferred_language: u.preferred_language ?? null,
      };
    }
    return CREATE_DEFAULTS;
  }, []);

  const defaultValues = useMemo(() => buildDefaults(user), [user, buildDefaults]);

  // Invalide le cache profil pour que la page profil reflète les changements
  const handleSuccess = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ['profile'] });
    onSuccess?.();
  }, [queryClient, onSuccess]);

  const formState = useUserFormDrawer({
    open,
    onClose,
    onSuccess: handleSuccess,
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
        address: values.address ?? null,
        zip_code: values.zip_code ?? null,
        city: values.city ?? null,
        country: values.country ?? null,
        timezone: values.timezone ?? null,
        preferred_language: values.preferred_language ?? null,
      }) as CreateClientUserPayload,
    buildUpdatePayload: (values, id) => ({
      id,
      data: {
        first_name: values.first_name,
        last_name: values.last_name,
        email: values.email,
        role: values.role as UpdateClientUserPayload['role'],
        is_active: values.is_active,
        address: values.address ?? null,
        zip_code: values.zip_code ?? null,
        city: values.city ?? null,
        country: values.country ?? null,
        timezone: values.timezone ?? null,
        preferred_language: values.preferred_language ?? null,
      } as UpdateClientUserPayload,
    }),
  });

  useEffect(() => {
    if (open) {
      formState.form.reset(defaultValues);
    }
  }, [open, defaultValues, formState.form]);

  // Corps de la soumission, englobe par le verrou pose dans onSubmitWithPhoto.
  const runSubmit = useCallback(
    async (values: Record<string, unknown>) => {
      if (isEdit && user && pendingPhotoRef.current) {
        // PATCH d'abord — l'upload photo n'a lieu qu'après la sauvegarde réussie
        try {
          await updateMutation.mutateAsync({
            id: user.id,
            data: {
              first_name: values.first_name as string,
              last_name: values.last_name as string,
              email: values.email as string,
              role: values.role as UpdateClientUserPayload['role'],
              is_active: values.is_active as boolean,
              address: (values.address as string | null) ?? null,
              zip_code: (values.zip_code as string | null) ?? null,
              city: (values.city as string | null) ?? null,
              country: (values.country as string | null) ?? null,
              timezone: (values.timezone as string | null) ?? null,
              preferred_language: (values.preferred_language as string | null) ?? null,
            } as UpdateClientUserPayload,
          });
        } catch {
          // updateMutation.onError notifie deja : un toast ici en ferait deux.
          return;
        }
        // L'endpoint profile-photo lie déjà la photo côté backend — best-effort
        try {
          await uploadUserProfilePhoto(user.id, pendingPhotoRef.current, 'users');
          await queryClient.invalidateQueries({ queryKey: TENANT_USERS_QUERY_KEY });
        } catch {
          toast.warning("Données sauvegardées, mais l'upload photo a échoué.");
        }
        pendingPhotoRef.current = null;
        handleSuccess();
        onClose();
      } else if (!isEdit && pendingPhotoRef.current) {
        // Création : créer d'abord l'utilisateur, puis uploader la photo
        const pendingPhoto = pendingPhotoRef.current;
        let created: Awaited<ReturnType<typeof createMutation.mutateAsync>>;
        try {
          created = await createMutation.mutateAsync({
            first_name: values.first_name as string,
            last_name: values.last_name as string,
            email: values.email as string,
            password: values.password as string,
            role: values.role as CreateClientUserPayload['role'],
            tenant_id: tenantId,
            is_active: values.is_active as boolean,
            address: (values.address as string | null) ?? null,
            zip_code: (values.zip_code as string | null) ?? null,
            city: (values.city as string | null) ?? null,
            country: (values.country as string | null) ?? null,
            timezone: (values.timezone as string | null) ?? null,
            preferred_language: (values.preferred_language as string | null) ?? null,
          } as CreateClientUserPayload);
        } catch {
          // createMutation.onError notifie deja.
          return;
        }

        // Hors du try : l'utilisateur existe, une réponse inattendue ne doit pas
        // se lire comme un échec de création.
        const newUserId = created?.data?.id;

        if (newUserId) {
          // Upload séparé — l'utilisateur est déjà créé, l'échec photo ne bloque pas
          try {
            await uploadUserProfilePhoto(newUserId, pendingPhoto, 'users');
          } catch {
            toast.error("Utilisateur créé, mais l'upload photo a échoué.");
          }
        } else {
          toast.warning("Utilisateur créé, mais la photo n'a pas pu lui être associée.");
        }

        await queryClient.invalidateQueries({ queryKey: TENANT_USERS_QUERY_KEY });
        pendingPhotoRef.current = null;
        handleSuccess();
        onClose();
      } else {
        formState.onSubmit(values);
      }
    },
    [isEdit, user, createMutation, updateMutation, formState, handleSuccess, onClose, tenantId],
  );

  // Un seul verrou pour toute la soumission : la mutation se resout bien avant
  // l'upload puis le rafraichissement des listes.
  const onSubmitWithPhoto = useCallback(
    async (values: Record<string, unknown>) => {
      if (submittingRef.current) {
        return;
      }
      submittingRef.current = true;
      setIsSubmitting(true);

      try {
        await runSubmit(values);
      } finally {
        submittingRef.current = false;
        setIsSubmitting(false);
      }
    },
    [runSubmit],
  );

  const submitMutation = useMemo(
    () => ({ ...formState.mutation, isPending: formState.mutation.isPending || isSubmitting }),
    [formState.mutation, isSubmitting],
  );

  const activeField = (
    <FieldRoot
      control={formState.form.control}
      name="is_active"
      render={({ field }) => (
        <FieldGroup>
          <div className="flex items-center justify-between border p-3 bg-gray-50/40 rounded-sm">
            <FieldLabel className="text-xs">Autoriser l’accès au compte</FieldLabel>
            <Switch
              checked={field.value}
              onCheckedChange={field.onChange}
              aria-label="Autoriser l’accès au compte"
              className="data-checked:bg-(--color-primary)"
            />
          </div>
        </FieldGroup>
      )}
    />
  );

  return (
    <Sheet open={open} onOpenChange={(nextOpen) => !nextOpen && formState.handleClose()}>
      <SheetContent
        className="flex w-full flex-col gap-0 p-0 overflow-hidden sm:max-w-150! lg:max-w-200!"
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
          mutation={submitMutation}
          isEdit={formState.isEdit}
          handleClose={formState.handleClose}
          onSubmit={onSubmitWithPhoto}
          showPassword={formState.showPassword}
          togglePasswordVisibility={formState.togglePasswordVisibility}
          roleLabels={ROLE_LABELS}
          topFields={
            <UserPhotoField
              currentPhotoUrl={user?.profile_photo?.url ?? null}
              fullName={user ? `${user.first_name} ${user.last_name}` : ''}
              onFileSelected={(file) => {
                pendingPhotoRef.current = file;
              }}
            />
          }
          extraFields={
            <>
              <UserProfileFields form={formState.form} />
              {activeField}
            </>
          }
        />
      </SheetContent>
    </Sheet>
  );
}

export const UserFormDrawer = memo(UserFormDrawerBase);
