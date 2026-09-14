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
import { useClientsQuery } from '@/modules/admin/resources/clients';
import { Input } from '@/components/ui/input';
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
  timezone: z.string().nullable().optional(),
  preferred_language: z.string().nullable().optional(),
});

const createSchemaShape = z
  .object({
    first_name: z.string().min(1, 'Prénom requis').max(120),
    last_name: z.string().min(1, 'Nom requis').max(120),
    email: z.string().email('Email invalide').max(255),
    password: passwordSchema,
    role: z.nativeEnum(Role),
    tenant_id: z.string().uuid().nullable().optional(),
    client_id: z.string().uuid().nullable().optional(),
    client_name: z.string().max(255).nullable().optional(),
    is_active: z.boolean().default(true),
  })
  .merge(profileFieldsSchema);

// Un createur deja rattache a un client le transmet : il n'a aucun champ client
// a remplir, et rien a choisir.
const buildCreateSchema = (callerHasClient: boolean) =>
  createSchemaShape.superRefine((values, ctx) => {
    if (callerHasClient) {
      return;
    }

    // Un stagiaire rejoint un client existant ; un responsable en crée un ou
    // reprend celui du même nom.
    if (values.role === Role.TRAINEE && !values.client_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['client_id'],
        message: 'Client requis',
      });
    }

    if (values.role === Role.CLIENT_MANAGER && !values.client_name?.trim() && !values.client_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['client_name'],
        message: 'Nom du client requis',
      });
    }
  });

const updateSchemaShape = z
  .object({
    first_name: z.string().min(1, 'Prénom requis').max(120),
    last_name: z.string().min(1, 'Nom requis').max(120),
    email: z.string().email('Email invalide').max(255),
    password: passwordSchema.optional().or(z.literal('')),
    role: z.nativeEnum(Role),
    tenant_id: z.string().uuid().nullable().optional(),
    client_id: z.string().uuid().nullable().optional(),
    is_active: z.boolean(),
  })
  .merge(profileFieldsSchema);

// Le backend n'exige un client que si ce PATCH en change la valeur ou le role :
// un compte anterieur au cloisonnement reste modifiable tel quel.
const buildUpdateSchema = (canReassignClient: boolean, current?: User) =>
  updateSchemaShape.superRefine((values, ctx) => {
    const roleNeedsClient = values.role === Role.TRAINEE || values.role === Role.CLIENT_MANAGER;

    if (!canReassignClient || !roleNeedsClient || values.client_id) {
      return;
    }

    const clientCleared = (current?.client_id ?? null) !== null;
    const roleChanged = values.role !== current?.role;

    if (clientCleared || roleChanged) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['client_id'],
        message: 'Client requis',
      });
    }
  });

const ROLE_LABELS: Record<string, string> = {
  [Role.SUPER_ADMIN]: 'Super admin',
  [Role.EDITOR]: 'Éditeur',
  [Role.CLIENT_MANAGER]: 'Responsable',
  [Role.TRAINEE]: 'Stagiaire',
};

const ROLE_DEFAULTS: z.infer<typeof createSchemaShape> = {
  first_name: '',
  last_name: '',
  email: '',
  password: '',
  role: Role.TRAINEE,
  tenant_id: null,
  client_id: null,
  client_name: null,
  is_active: true,
  address: null,
  zip_code: null,
  city: null,
  country: null,
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

  // Le backend reserve la reaffectation a ces deux roles : un responsable
  // pourrait sinon deplacer ses apprenants hors de son perimetre.
  const canReassignClient = isSuperAdmin || authUser?.role === Role.EDITOR;

  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const pendingPhotoRef = useRef<File | null>(null);
  const queryClient = useQueryClient();

  const { data: tenantsData } = useQuery({
    queryKey: ['tenants-select'],
    queryFn: () => tenantApi.getAll(),
    enabled: isSuperAdmin && open,
  });

  // Un createur rattache a un client transmet le sien : aucun champ a afficher.
  const callerHasClient = authUser?.role === Role.CLIENT_MANAGER;

  // La liste n'est utile qu'a ceux qui choisissent reellement un client.
  const { data: clients } = useClientsQuery(
    open && !callerHasClient && (!isEdit || canReassignClient),
  );

  const createSchema = useMemo(() => buildCreateSchema(callerHasClient), [callerHasClient]);

  const updateSchema = useMemo(
    () => buildUpdateSchema(canReassignClient, user),
    [canReassignClient, user],
  );

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
        client_id: u.client_id ?? null,
        is_active: u.is_active,
        address: u.address ?? null,
        zip_code: u.zip_code ?? null,
        city: u.city ?? null,
        country: u.country ?? null,
        timezone: u.timezone ?? null,
        preferred_language: u.preferred_language ?? null,
      };
    }
    return ROLE_DEFAULTS;
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
    createDefaults: ROLE_DEFAULTS,
    buildCreatePayload: (values) =>
      ({
        first_name: values.first_name,
        last_name: values.last_name,
        email: values.email,
        password: values.password as string,
        role: values.role,
        tenant_id: values.tenant_id ?? null,
        client_id: values.role === Role.TRAINEE ? (values.client_id ?? null) : null,
        client_name: values.role === Role.CLIENT_MANAGER ? (values.client_name ?? null) : null,
        is_active: values.is_active,
        address: values.address ?? null,
        zip_code: values.zip_code ?? null,
        city: values.city ?? null,
        country: values.country ?? null,
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
        // Envoye uniquement si l'admin l'a reellement change : le backend
        // traite « client_id present » comme un acte delibere et refuserait
        // une edition anodine sur un compte anterieur au cloisonnement.
        ...(canReassignClient && (values.client_id ?? null) !== (user?.client_id ?? null)
          ? { client_id: (values.client_id as string | null) ?? null }
          : {}),
        is_active: values.is_active,
        address: values.address ?? null,
        zip_code: values.zip_code ?? null,
        city: values.city ?? null,
        country: values.country ?? null,
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
        // PATCH d'abord — l'upload photo n'a lieu qu'après la sauvegarde réussie
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
              address: (values.address as string | null) ?? null,
              zip_code: (values.zip_code as string | null) ?? null,
              city: (values.city as string | null) ?? null,
              country: (values.country as string | null) ?? null,
              timezone: (values.timezone as string | null) ?? null,
              preferred_language: (values.preferred_language as string | null) ?? null,
            } as UpdateUserPayload,
          });
        } catch {
          toast.error("Échec de la mise à jour de l'utilisateur.");
          return;
        }
        // L'endpoint profile-photo lie déjà la photo côté backend — best-effort
        try {
          await uploadUserProfilePhoto(user.id, pendingPhotoRef.current, 'platform/users');
          await queryClient.invalidateQueries({ queryKey: ADMIN_USERS_QUERY_KEY });
        } catch {
          toast.warning("Données sauvegardées, mais l'upload photo a échoué.");
        }
        pendingPhotoRef.current = null;
        handleSuccess();
        onClose();
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
            client_id:
              values.role === Role.TRAINEE ? ((values.client_id as string | null) ?? null) : null,
            client_name:
              values.role === Role.CLIENT_MANAGER
                ? ((values.client_name as string | null) ?? null)
                : null,
            is_active: values.is_active as boolean,
            address: (values.address as string | null) ?? null,
            zip_code: (values.zip_code as string | null) ?? null,
            city: (values.city as string | null) ?? null,
            country: (values.country as string | null) ?? null,
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
        handleSuccess();
        onClose();
      } else {
        formState.onSubmit(values);
      }
    },
    [isEdit, user, createMutation, updateMutation, formState, queryClient, onSuccess, onClose],
  );

  // Champ is_active — toggle actif/inactif
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

  // Le rattachement client suit le role choisi dans le formulaire, pas celui de
  // l'utilisateur connecte : un responsable nomme son client, un stagiaire
  // rejoint un client existant, les autres roles n'en ont pas.
  const selectedRole = formState.form.watch('role');

  const roleNeedsClient = selectedRole === Role.TRAINEE || selectedRole === Role.CLIENT_MANAGER;

  // En edition on ne propose que des clients existants : creer un client depuis
  // un formulaire d'edition ferait naitre un client fantome sur une faute de frappe.
  const showClientSelect =
    !callerHasClient &&
    (isEdit ? canReassignClient && roleNeedsClient : selectedRole === Role.TRAINEE);

  const clientField = !selectedRole ? null : !isEdit &&
    !callerHasClient &&
    selectedRole === Role.CLIENT_MANAGER ? (
    <FieldRoot
      control={formState.form.control}
      name="client_name"
      render={({ field }) => (
        <FieldGroup>
          <FieldLabel className="text-xs">Nom du client</FieldLabel>
          <FieldContent>
            <Input
              placeholder="Ex : Globex Corporation"
              className="text-xs"
              value={field.value ?? ''}
              onChange={(e) => field.onChange(e.target.value || null)}
              aria-label="Nom du client"
            />
          </FieldContent>
          <p className="text-[11px] text-muted-foreground">
            Le client est créé s’il n’existe pas encore dans ce tenant.
          </p>
          <FieldError />
        </FieldGroup>
      )}
    />
  ) : showClientSelect ? (
    <FieldRoot
      control={formState.form.control}
      name="client_id"
      render={({ field }) => (
        <FieldGroup>
          <FieldLabel className="text-xs">Client</FieldLabel>
          <Select onValueChange={field.onChange} value={field.value ?? undefined}>
            <FieldContent>
              <SelectTrigger size="default" aria-label="Client" className="w-full">
                <SelectValue placeholder="Sélectionner un client" />
              </SelectTrigger>
            </FieldContent>
            <SelectContent>
              {(clients ?? []).map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {clients?.length === 0 ? (
            <p className="text-[11px] text-muted-foreground">
              Aucun client dans ce tenant. Créez d’abord un responsable.
            </p>
          ) : null}
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
              {clientField}
              <UserProfileFields form={formState.form} />
              {activeField}
            </>
          }
        />
      </SheetContent>
    </Sheet>
  );
}

export const AdminUserFormDrawer = memo(AdminUserFormDrawerBase);
