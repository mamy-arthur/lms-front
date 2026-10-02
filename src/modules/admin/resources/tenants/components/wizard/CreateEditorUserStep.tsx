'use client';

import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldRoot,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { UserPhotoField } from '@modules/shared/components/users/user-photo-field';
import { UserProfileFields } from '@modules/shared/components/users/user-profile-fields';
import { adminUsersApi, ADMIN_USERS_QUERY_KEY } from '@/modules/admin/resources/users';
import { Role } from '@/shared/constants/roles';
import { uploadUserProfilePhoto } from '@/modules/shared/lib/uploadUserProfilePhoto';

const editorUserSchema = z.object({
  first_name: z.string().min(1, 'Prénom requis').max(120),
  last_name: z.string().min(1, 'Nom requis').max(120),
  email: z.string().email('Email invalide').max(255),
  password: z
    .string()
    .min(8, 'Minimum 8 caractères')
    .regex(/[A-Z]/, 'Au moins une majuscule')
    .regex(/[a-z]/, 'Au moins une minuscule')
    .regex(/[0-9]/, 'Au moins un chiffre')
    .max(255),
  is_active: z.boolean(),
  address: z.string().max(255).nullable().optional(),
  zip_code: z.string().max(20).nullable().optional(),
  city: z.string().max(100).nullable().optional(),
  country: z.string().length(2).nullable().optional(),
  timezone: z.string().nullable().optional(),
  preferred_language: z.string().nullable().optional(),
});

type EditorUserFormData = z.infer<typeof editorUserSchema>;

export interface CreateEditorUserStepHandle {
  triggerSubmit: () => void;
}

interface Props {
  tenantId: string;
  tenantName: string;
  editorId: string | null;
  onSuccess: () => void;
  onLoadingChange: (loading: boolean) => void;
}

export const CreateEditorUserStep = forwardRef<CreateEditorUserStepHandle, Props>(
  ({ tenantId, tenantName, editorId, onSuccess, onLoadingChange }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const pendingPhotoRef = useRef<File | null>(null);

    const form = useForm<EditorUserFormData>({
      resolver: zodResolver(editorUserSchema),
      mode: 'onChange',
      defaultValues: {
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        is_active: true,
        address: null,
        zip_code: null,
        city: null,
        country: null,
        timezone: null,
        preferred_language: null,
      },
    });

    const queryClient = useQueryClient();
    const { mutateAsync: createEditorUser } = useMutation({
      mutationFn: adminUsersApi.create,
    });

    const onSubmit = useCallback(
      async (values: EditorUserFormData) => {
        onLoadingChange(true);
        try {
          const res = await createEditorUser({
            first_name: values.first_name,
            last_name: values.last_name,
            email: values.email,
            password: values.password,
            role: Role.EDITOR,
            tenant_id: tenantId,
            editor_id: editorId,
            is_active: values.is_active,
            address: values.address ?? null,
            zip_code: values.zip_code ?? null,
            city: values.city ?? null,
            country: values.country ?? null,
            timezone: values.timezone ?? null,
            preferred_language: values.preferred_language ?? null,
          });

          if (pendingPhotoRef.current) {
            try {
              await uploadUserProfilePhoto(res.data.id, pendingPhotoRef.current, 'platform/users');
            } catch {
              toast.error("Éditeur créé, mais l'upload photo a échoué.");
            }
          }

          void queryClient.invalidateQueries({ queryKey: ADMIN_USERS_QUERY_KEY });
          toast.success("L'éditeur a été créé avec succès.");
          onLoadingChange(false);
          onSuccess();
        } catch {
          toast.error("Échec de la création de l'éditeur.");
          onLoadingChange(false);
        }
      },
      [tenantId, editorId, onSuccess, onLoadingChange, createEditorUser, queryClient],
    );

    useImperativeHandle(ref, () => ({ triggerSubmit: form.handleSubmit(onSubmit) }), [
      form.handleSubmit,
      onSubmit,
    ]);

    return (
      <Field {...form}>
        <div className="space-y-5">
          <UserPhotoField
            onFileSelected={(file) => {
              pendingPhotoRef.current = file;
            }}
          />

          <div className="flex flex-row gap-4">
            <FieldRoot
              control={form.control}
              name="last_name"
              render={({ field }) => (
                <FieldGroup>
                  <FieldLabel className="text-xs">Nom</FieldLabel>
                  <FieldContent>
                    <Input autoFocus aria-label="Nom" className="text-xs" {...field} />
                  </FieldContent>
                  <FieldError />
                </FieldGroup>
              )}
            />
            <FieldRoot
              control={form.control}
              name="first_name"
              render={({ field }) => (
                <FieldGroup>
                  <FieldLabel className="text-xs">Prénom</FieldLabel>
                  <FieldContent>
                    <Input aria-label="Prénom" className="text-xs" {...field} />
                  </FieldContent>
                  <FieldError />
                </FieldGroup>
              )}
            />
          </div>

          <FieldRoot
            control={form.control}
            name="email"
            render={({ field }) => (
              <FieldGroup>
                <FieldLabel className="text-xs">Email</FieldLabel>
                <FieldContent>
                  <Input type="email" aria-label="Email" className="text-xs" {...field} />
                </FieldContent>
                <FieldError />
              </FieldGroup>
            )}
          />

          {/* Rôle fixé à Éditeur — non modifiable dans ce contexte */}
          <FieldGroup>
            <label className="text-xs font-medium text-foreground select-none">Rôle</label>
            <div className="flex h-9 w-full items-center rounded-md border border-input bg-muted px-3 text-xs text-muted-foreground">
              Éditeur
            </div>
          </FieldGroup>

          {/* Tenant fixé au tenant créé à l'étape précédente */}
          <FieldGroup>
            <label className="text-xs font-medium text-foreground select-none">Tenant</label>
            <div className="flex h-9 w-full items-center rounded-md border border-input bg-muted px-3 text-xs text-muted-foreground">
              {tenantName}
            </div>
          </FieldGroup>

          <UserProfileFields form={form} />

          <FieldRoot
            control={form.control}
            name="is_active"
            render={({ field }) => (
              <FieldGroup>
                <div className="flex items-center justify-between">
                  <FieldLabel className="text-xs">Autoriser l’accès au compte</FieldLabel>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    aria-label="Autoriser l’accès au compte"
                  />
                </div>
              </FieldGroup>
            )}
          />

          <FieldRoot
            control={form.control}
            name="password"
            render={({ field }) => (
              <FieldGroup>
                <FieldLabel className="text-xs">Mot de passe</FieldLabel>
                <FieldContent>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      aria-label="Mot de passe"
                      className="text-xs"
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                      aria-label={
                        showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'
                      }
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </FieldContent>
                <FieldError />
              </FieldGroup>
            )}
          />
        </div>
      </Field>
    );
  },
);

CreateEditorUserStep.displayName = 'CreateEditorUserStep';
