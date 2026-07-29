'use client';

import { memo, useCallback, useMemo, useRef } from 'react';
import { z } from 'zod';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Role } from '@/shared/constants/roles';
import { useUserFormDrawer } from '@modules/shared/components/users/use-user-form-drawer';
import { UserForm } from '@modules/shared/components/users/user-form';
import { useCreateUser } from '../../hooks/useCreateUser';
import { useUpdateUser } from '../../hooks/useUpdateUser';
import type { CreateUserPayload, UpdateUserPayload, User } from '../../types';
import { useAuthStore } from '@/shared/stores/auth.store';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { tenantApi } from '@/modules/admin/resources/tenants/api';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FieldContent, FieldError, FieldGroup, FieldLabel, FieldRoot } from '@/components/ui/field';
import { Switch } from '@/components/ui/switch';
import { UserPhotoField } from '@modules/shared/components/users/user-photo-field';
import { UserProfileFields } from '@modules/shared/components/users/user-profile-fields';
import { uploadUserProfilePhoto } from '@/modules/shared/lib/uploadUserProfilePhoto';
import { toast } from 'sonner';
import { ADMIN_USERS_QUERY_KEY } from '../../hooks/useUsersQuery';

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
  biography: z.string().max(2000, 'Maximum 2000 caractères').nullable().optional(),
  timezone: z.string().nullable().optional(),
  preferred_language: z.string().nullable().optional(),
});

const createSchema = z
  .object({
    first_name: z.string().min(1, 'Prénom requis').max(120),
    last_name: z.string().min(1, 'Nom requis').max(120),
    email: z.string().email('Email invalide').max(255),
    password: passwordSchema,
    role: z.nativeEnum(Role),
    tenant_id: z.string().uuid().nullable().optional(),
    is_active: z.boolean().default(true),
  })
  .merge(profileFieldsSchema);

const updateSchema = z
  .object({
    first_name: z.string().min(1, 'Prénom requis').max(120),
    last_name: z.string().min(1, 'Nom requis').max(120),
    email: z.string().email('Email invalide').max(255),
    password: passwordSchema.optional().or(z.literal('')),
    role: z.nativeEnum(Role),
    tenant_id: z.string().uuid().nullable().optional(),
    is_active: z.boolean(),
  })
  .merge(profileFieldsSchema);

const ROLE_LABELS: Record<string, string> = {
  [Role.SUPER_ADMIN]: 'Super admin',
  [Role.EDITOR]: 'Éditeur',
  [Role.CLIENT_MANAGER]: 'Responsable',
  [Role.TRAINEE]: 'Stagiaire',
};

const ROLE_DEFAULTS: z.infer<typeof createSchema> = {
  first_name: '',
  last_name: '',
  email: '',
  password: '',
  role: Role.TRAINEE,
  tenant_id: null,
  is_active: true,
  address: null,
  zip_code: null,
  city: null,
  country: null,
  biography: null,
  timezone: null,
  preferred_language: null,
};

export interface AdminUserFormDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  user?: User;
}

function AdminUserFormDrawerBase({ open, onClose, onSuccess, user }: AdminUserFormDrawerProps) {
  const isEdit = !!user;
  const { user: authUser } = useAuthStore();
  const isSuperAdmin = authUser?.role === Role.SUPER_ADMIN;

  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const pendingPhotoRef = useRef<File | null>(null);
  const queryClient = useQueryClient();

  const { data: tenantsData } = useQuery({
    queryKey: ['tenants-select'],
    queryFn: () => tenantApi.getAll(),
    enabled: isSuperAdmin && open,
  });

  const schema = isEdit ? updateSchema : createSchema;

  const buildDefaults = useCallback((u?: User) => {
    if (u) {
      return {
        first_name: u.first_name,
        last_name: u.last_name,
        email: u.email,
        password: '',
        role: u.role,
        tenant_id: u.tenant_id ?? null,
        is_active: u.is_active,
        address: u.address ?? null,
        zip_code: u.zip_code ?? null,
        city: u.city ?? null,
        country: u.country ?? null,
        biography: u.biography ?? null,
        timezone: u.timezone ?? null,
        preferred_language: u.preferred_language ?? null,
      };
    }
    return ROLE_DEFAULTS;
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
    createDefaults: ROLE_DEFAULTS,
    buildCreatePayload: (values) =>
      ({
        first_name: values.first_name,
        last_name: values.last_name,
        email: values.email,
        password: values.password as string,
        role: values.role,
        tenant_id: values.tenant_id ?? null,
        is_active: values.is_active,
        address: values.address ?? null,
        zip_code: values.zip_code ?? null,
        city: values.city ?? null,
        country: values.country ?? null,
        biography: values.biography ?? null,
        timezone: values.timezone ?? null,
        preferred_language: values.preferred_language ?? null,
      }) as CreateUserPayload,
    buildUpdatePayload: (values, id) => ({
      id,
      data: {
        first_name: values.first_name,
        last_name: values.last_name,
        email: values.email,
        role: values.role,
        tenant_id: values.tenant_id ?? null,
        is_active: values.is_active,
        address: values.address ?? null,
        zip_code: values.zip_code ?? null,
        city: values.city ?? null,
        country: values.country ?? null,
        biography: values.biography ?? null,
        timezone: values.timezone ?? null,
        preferred_language: values.preferred_language ?? null,
        // profile_photo_media_id géré après upload dans onSubmitWithPhoto
      } as UpdateUserPayload,
    }),
  });

  // Submit avec upload photo si fichier sélectionné
  const onSubmitWithPhoto = useCallback(
    async (values: Record<string, unknown>) => {
      if (isEdit && user && pendingPhotoRef.current) {
        let mediaId: string;
        try {
          const media = await uploadUserProfilePhoto(
            user.id,
            pendingPhotoRef.current,
            'platform/users',
          );
          mediaId = media.id;
        } catch {
          toast.error("Échec de l'upload photo. Réessayez.");
          return;
        }
        try {
          await updateMutation.mutateAsync({
            id: user.id,
            data: {
              first_name: values.first_name as string,
              last_name: values.last_name as string,
              email: values.email as string,
              role: values.role as UpdateUserPayload['role'],
              tenant_id: (values.tenant_id as string | null) ?? null,
              is_active: values.is_active as boolean,
              profile_photo_media_id: mediaId,
              address: (values.address as string | null) ?? null,
              zip_code: (values.zip_code as string | null) ?? null,
              city: (values.city as string | null) ?? null,
              country: (values.country as string | null) ?? null,
              biography: (values.biography as string | null) ?? null,
              timezone: (values.timezone as string | null) ?? null,
              preferred_language: (values.preferred_language as string | null) ?? null,
            } as UpdateUserPayload,
          });
          pendingPhotoRef.current = null;
          onSuccess?.();
          onClose();
        } catch {
          toast.error("Échec de la mise à jour de l'utilisateur.");
        }
      } else if (!isEdit && pendingPhotoRef.current) {
        // Création : créer d'abord l'utilisateur, puis uploader la photo
        let newUserId: string;
        try {
          const res = await createMutation.mutateAsync({
            first_name: values.first_name as string,
            last_name: values.last_name as string,
            email: values.email as string,
            password: values.password as string,
            role: values.role as CreateUserPayload['role'],
            tenant_id: (values.tenant_id as string | null) ?? null,
            is_active: values.is_active as boolean,
            address: (values.address as string | null) ?? null,
            zip_code: (values.zip_code as string | null) ?? null,
            city: (values.city as string | null) ?? null,
            country: (values.country as string | null) ?? null,
            biography: (values.biography as string | null) ?? null,
            timezone: (values.timezone as string | null) ?? null,
            preferred_language: (values.preferred_language as string | null) ?? null,
          } as CreateUserPayload);
          newUserId = (res as { data: { id: string } }).data.id;
        } catch {
          toast.error("Échec de la création de l'utilisateur.");
          return;
        }
        // Upload séparé — l'utilisateur est déjà créé, l'échec photo ne bloque pas
        try {
          await uploadUserProfilePhoto(newUserId, pendingPhotoRef.current, 'platform/users');
        } catch {
          toast.error("Utilisateur créé, mais l'upload photo a échoué.");
        }
        await queryClient.invalidateQueries({ queryKey: ADMIN_USERS_QUERY_KEY });
        pendingPhotoRef.current = null;
        onSuccess?.();
        onClose();
      } else {
        formState.onSubmit(values);
      }
    },
    [isEdit, user, createMutation, updateMutation, formState, onSuccess, onClose],
  );

  // Champ is_active — toggle actif/inactif
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

  // Champ tenant_id — affiché uniquement pour SuperAdmin
  const tenantField = isSuperAdmin ? (
    <FieldRoot
      control={formState.form.control}
      name="tenant_id"
      render={({ field }) => (
        <FieldGroup>
          <FieldLabel className="text-xs">Tenant</FieldLabel>
          <Select
            onValueChange={(v) => field.onChange(v === '__none__' ? null : v)}
            value={field.value ?? '__none__'}
          >
            <FieldContent>
              <SelectTrigger size="default" aria-label="Tenant" className="w-full">
                <SelectValue placeholder="Aucun (utilisateur global)" />
              </SelectTrigger>
            </FieldContent>
            <SelectContent>
              <SelectItem value="__none__">Aucun (utilisateur global)</SelectItem>
              {(tenantsData?.data ?? []).map((t) => (
                <SelectItem key={String(t.id)} value={String(t.id)}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError />
        </FieldGroup>
      )}
    />
  ) : null;

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
          mutation={formState.mutation}
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
              {tenantField}
              {activeField}
              <UserProfileFields form={formState.form} />
            </>
          }
        />
      </SheetContent>
    </Sheet>
  );
}

export const AdminUserFormDrawer = memo(AdminUserFormDrawerBase);
