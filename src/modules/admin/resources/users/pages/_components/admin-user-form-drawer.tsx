'use client';

import { useUserFormDrawer } from '@modules/shared/components/users/use-user-form-drawer';
import { UserForm } from '@modules/shared/components/users/user-form';
import { UserPhotoField } from '@modules/shared/components/users/user-photo-field';
import { UserProfileFields } from '@modules/shared/components/users/user-profile-fields';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { FieldContent, FieldError, FieldGroup, FieldLabel, FieldRoot } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { useClientsQuery } from '@/modules/admin/resources/clients';
import { tenantApi } from '@/modules/admin/resources/tenants/api';
import { uploadUserProfilePhoto } from '@/modules/shared/lib/uploadUserProfilePhoto';
import { Role } from '@/shared/constants/roles';
import { passwordPolicySchema } from '@/shared/schemas/auth.schema';
import { useAuthStore } from '@/shared/stores/auth.store';
import { useCreateUser } from '../../hooks/useCreateUser';
import { useUpdateUser } from '../../hooks/useUpdateUser';
import { ADMIN_USERS_QUERY_KEY } from '../../hooks/useUsersQuery';
import type { CreateUserPayload, UpdateUserPayload, User } from '../../types';
import { ClientNameCombobox } from './client-name-combobox';

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
    password: passwordPolicySchema,
    role: z.nativeEnum(Role),
    tenant_id: z.string().uuid().nullable().optional(),
    client_id: z.string().uuid().nullable().optional(),
    client_name: z.string().max(255).nullable().optional(),
    is_active: z.boolean().default(true),
  })
  .merge(profileFieldsSchema);

// Un createur deja rattache a un client le transmet : il n'a aucun champ client
// a remplir, et rien a choisir.
const buildCreateSchema = (callerHasClient: boolean, allowedRoles: readonly Role[]) =>
  createSchemaShape.superRefine((values, ctx) => {
    if (!allowedRoles.includes(values.role)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['role'],
        message: 'Vous ne pouvez pas créer un utilisateur avec ce rôle.',
      });
    }

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
    password: passwordPolicySchema.optional().or(z.literal('')),
    role: z.nativeEnum(Role),
    tenant_id: z.string().uuid().nullable().optional(),
    client_id: z.string().uuid().nullable().optional(),
    is_active: z.boolean(),
  })
  .merge(profileFieldsSchema);

// Le backend exige un client si ce PATCH change le client, le role ou le tenant :
// un compte anterieur au cloisonnement reste modifiable tel quel.
const buildUpdateSchema = (canReassignClient: boolean, current?: User) =>
  updateSchemaShape.superRefine((values, ctx) => {
    const roleNeedsClient = values.role === Role.TRAINEE || values.role === Role.CLIENT_MANAGER;

    if (!canReassignClient || !roleNeedsClient || values.client_id) {
      return;
    }

    const clientCleared = (current?.client_id ?? null) !== null;
    const roleChanged = values.role !== current?.role;
    const tenantChanged = (values.tenant_id ?? null) !== (current?.tenant_id ?? null);

    if (clientCleared || roleChanged || tenantChanged) {
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

const CREATABLE_ROLES: Record<Role, readonly Role[]> = {
  [Role.SUPER_ADMIN]: [Role.SUPER_ADMIN, Role.EDITOR, Role.CLIENT_MANAGER, Role.TRAINEE],
  [Role.EDITOR]: [Role.EDITOR, Role.CLIENT_MANAGER, Role.TRAINEE],
  [Role.CLIENT_MANAGER]: [Role.CLIENT_MANAGER, Role.TRAINEE],
  [Role.TRAINEE]: [],
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
  const role = useAuthStore((s) => s.role);
  const isSuperAdmin = role === Role.SUPER_ADMIN;

  // Le backend reserve la reaffectation a ces deux roles : un responsable
  // pourrait sinon deplacer ses apprenants hors de son perimetre.
  const canReassignClient = isSuperAdmin || role === Role.EDITOR;

  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const pendingPhotoRef = useRef<File | null>(null);
  // L'upload photo suit la mutation : sans ce verrou le bouton se réactive entre les deux.
  const [isUploading, setIsUploading] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    pendingPhotoRef.current = null;
  }, [open, user?.id]);

  const { data: tenantsData } = useQuery({
    queryKey: ['tenants-select'],
    queryFn: () => tenantApi.getAll(),
    enabled: isSuperAdmin && open,
  });

  // Un createur rattache a un client transmet le sien : aucun champ a afficher.
  const callerHasClient = role === Role.CLIENT_MANAGER;

  const creatableRoles = CREATABLE_ROLES[role ?? Role.TRAINEE];
  const roleLabels = isEdit
    ? ROLE_LABELS
    : Object.fromEntries(creatableRoles.map((role) => [role, ROLE_LABELS[role]]));

  const createSchema = useMemo(
    () => buildCreateSchema(callerHasClient, creatableRoles),
    [callerHasClient, creatableRoles],
  );

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
        client_id:
          values.role === Role.TRAINEE || values.role === Role.CLIENT_MANAGER
            ? (values.client_id ?? null)
            : null,
        // Le nom n'est transmis que faute de client existant retenu : l'envoyer
        // avec un client_id rendrait l'intention ambigue.
        client_name:
          values.role === Role.CLIENT_MANAGER && !values.client_id
            ? (values.client_name ?? null)
            : null,
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

  // Le rattachement client suit le role choisi dans le formulaire, pas celui de
  // l'utilisateur connecte : un responsable nomme son client, un stagiaire
  // rejoint un client existant, les autres roles n'en ont pas.
  const selectedRole = formState.form.watch('role');

  // Un compte global n'a pas de tenant propre : c'est celui du formulaire qui
  // determine les clients proposables.
  const selectedTenantId = formState.form.watch('tenant_id') ?? null;

  // La liste n'est utile qu'a ceux qui choisissent reellement un client.
  const {
    data: clients,
    isLoading: clientsLoading,
    isError: clientsError,
    isFetching: clientsFetching,
    refetch: refetchClients,
  } = useClientsQuery(
    open &&
      !callerHasClient &&
      (!isEdit || canReassignClient) &&
      (!isSuperAdmin || selectedTenantId !== null),
    isSuperAdmin ? selectedTenantId : null,
  );

  // Submit avec upload photo si fichier sélectionné
  const onSubmitWithPhoto = useCallback(
    async (values: Record<string, unknown>) => {
      const pendingPhoto = pendingPhotoRef.current;
      if (isEdit && user && pendingPhoto) {
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
              ...(canReassignClient && (values.client_id ?? null) !== (user?.client_id ?? null)
                ? { client_id: (values.client_id as string | null) ?? null }
                : {}),
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
          // updateMutation.onError notifie deja : un toast ici en ferait deux.
          return;
        }
        // L'endpoint profile-photo lie déjà la photo côté backend — best-effort
        setIsUploading(true);
        try {
          await uploadUserProfilePhoto(user.id, pendingPhoto, 'platform/users');
          await queryClient.invalidateQueries({
            queryKey: ADMIN_USERS_QUERY_KEY,
          });
        } catch {
          toast.warning("Données sauvegardées, mais l'upload photo a échoué.");
        } finally {
          setIsUploading(false);
        }
        pendingPhotoRef.current = null;
        handleSuccess();
        onClose();
      } else if (!isEdit && pendingPhoto) {
        // Création : créer d'abord l'utilisateur, puis uploader la photo
        let created: Awaited<ReturnType<typeof createMutation.mutateAsync>>;
        try {
          created = await createMutation.mutateAsync({
            first_name: values.first_name as string,
            last_name: values.last_name as string,
            email: values.email as string,
            password: values.password as string,
            role: values.role as CreateUserPayload['role'],
            tenant_id: (values.tenant_id as string | null) ?? null,
            client_id:
              values.role === Role.TRAINEE || values.role === Role.CLIENT_MANAGER
                ? ((values.client_id as string | null) ?? null)
                : null,
            client_name:
              values.role === Role.CLIENT_MANAGER && !values.client_id
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
        } catch {
          // createMutation.onError notifie deja.
          return;
        }

        // Hors du try : l'utilisateur existe, une réponse inattendue ne doit pas
        // se lire comme un échec de création.
        const newUserId = created?.data?.id;

        if (newUserId) {
          // Upload séparé — l'utilisateur est déjà créé, l'échec photo ne bloque pas
          setIsUploading(true);
          try {
            await uploadUserProfilePhoto(newUserId, pendingPhoto, 'platform/users');
          } catch {
            toast.error("Utilisateur créé, mais l'upload photo a échoué.");
          } finally {
            setIsUploading(false);
          }
        } else {
          toast.warning("Utilisateur créé, mais la photo n'a pas pu lui être associée.");
        }

        await queryClient.invalidateQueries({
          queryKey: ADMIN_USERS_QUERY_KEY,
        });
        pendingPhotoRef.current = null;
        handleSuccess();
        onClose();
      } else {
        formState.onSubmit(values);
      }
    },
    [
      isEdit,
      user,
      canReassignClient,
      createMutation,
      updateMutation,
      formState,
      queryClient,
      handleSuccess,
      onClose,
    ],
  );

  const submitMutation = useMemo(
    () => ({ ...formState.mutation, isPending: formState.mutation.isPending || isUploading }),
    [formState.mutation, isUploading],
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
            onValueChange={(value) => {
              if (!value) return;
              const tenantId = value === '__none__' ? null : value;
              if (tenantId === (field.value ?? null)) return;

              field.onChange(tenantId);
              formState.form.setValue('client_id', null);
              formState.form.setValue('client_name', null);
            }}
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

  const roleNeedsClient = selectedRole === Role.TRAINEE || selectedRole === Role.CLIENT_MANAGER;
  // En edition on ne propose que des clients existants : creer un client depuis
  // un formulaire d'edition ferait naitre un client fantome sur une faute de frappe.
  const showClientSelect =
    !callerHasClient &&
    (isEdit ? canReassignClient && roleNeedsClient : selectedRole === Role.TRAINEE);

  const clientsUnavailable = clientsLoading || clientsError || clients === undefined;
  const clientQueryStatus = clientsError ? (
    <div className="space-y-1">
      <p role="alert" className="text-xs text-destructive">
        Impossible de charger les clients.
      </p>
      <Button
        type="button"
        variant="outline"
        disabled={clientsFetching}
        onClick={() => void refetchClients()}
      >
        <RefreshCw className="size-3.5" />
        Réessayer
      </Button>
    </div>
  ) : clientsLoading ? (
    <p role="status" className="text-xs text-muted-foreground">
      Chargement des clients…
    </p>
  ) : null;

  const clientField = !selectedRole ? null : !isEdit &&
    !callerHasClient &&
    selectedRole === Role.CLIENT_MANAGER ? (
    <FieldRoot
      control={formState.form.control}
      name="client_name"
      render={({ field }) => (
        <FieldGroup>
          <FieldLabel className="text-xs">Client</FieldLabel>
          <FieldContent>
            <ClientNameCombobox
              key={selectedTenantId ?? 'implicit-tenant'}
              tenantId={isSuperAdmin ? selectedTenantId : null}
              ref={field.ref}
              name={field.name}
              onBlur={field.onBlur}
              clients={clients ?? []}
              isLoading={clientsLoading}
              disabled={clientsUnavailable || (isSuperAdmin && selectedTenantId === null)}
              clientId={formState.form.watch('client_id') ?? null}
              clientName={field.value ?? null}
              onSelectExisting={(client) => {
                // Le client_id prime cote backend : le nom ne sert plus qu'a l'affichage.
                formState.form.setValue('client_id', client.id, {
                  shouldValidate: true,
                });
                field.onChange(client.name);
              }}
              onUseNewName={(name) => {
                formState.form.setValue('client_id', null, {
                  shouldValidate: true,
                });
                field.onChange(name || null);
              }}
            />
          </FieldContent>
          {clientQueryStatus}
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
          <Select
            disabled={clientsUnavailable || (isSuperAdmin && selectedTenantId === null)}
            onValueChange={(value) => {
              if (value) field.onChange(value);
            }}
            value={field.value ?? ''}
          >
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
          {clientQueryStatus}
          {!clientsUnavailable && clients?.length === 0 ? (
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
          mutation={submitMutation}
          isEdit={formState.isEdit}
          handleClose={formState.handleClose}
          onSubmit={onSubmitWithPhoto}
          showPassword={formState.showPassword}
          togglePasswordVisibility={formState.togglePasswordVisibility}
          roleLabels={roleLabels}
          topFields={
            <UserPhotoField
              key={`${open ? 'open' : 'closed'}:${user?.id ?? 'create'}`}
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
