/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { Eye, EyeOff, Loader2, Save } from 'lucide-react';
import type { ReactNode } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldRoot,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { MutationLike } from '@/shared/types/mutation';
import { extractUserFormError } from '@/shared/utils/api-error';

export interface UserFormProps {
  form: UseFormReturn<any>;
  mutation: MutationLike;
  isEdit: boolean;
  handleClose: () => void;
  onSubmit: (values: any) => void;
  showPassword: boolean;
  togglePasswordVisibility: () => void;
  roleLabels: Record<string, string>;
  lastLogin?: string;
  extraFields?: ReactNode;
  topFields?: ReactNode;
}

export function UserForm({
  form,
  mutation,
  isEdit,
  handleClose,
  onSubmit,
  showPassword,
  togglePasswordVisibility,
  roleLabels,
  lastLogin,
  extraFields,
  topFields,
}: UserFormProps) {
  return (
    <Field {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-1 flex-col min-h-0"
        noValidate
      >
        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
          {mutation.isError && (
            <div
              role="alert"
              className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {extractUserFormError(mutation.error, isEdit)}
            </div>
          )}
          {topFields}
          <div className="grid grid-cols-2 gap-4">
            <FieldRoot
              control={form.control}
              name="last_name"
              render={({ field }) => (
                <FieldGroup>
                  <FieldLabel className="text-xs">Nom</FieldLabel>
                  <FieldContent>
                    <Input
                      autoFocus
                      aria-label="Nom"
                      placeholder="Dupont"
                      className="text-xs"
                      {...field}
                    />
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
                    <Input aria-label="Prénom" placeholder="Jean" className="text-xs" {...field} />
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
                  <Input
                    type="email"
                    aria-label="Email"
                    placeholder="jean.dupont@exemple.com"
                    className="text-xs"
                    {...field}
                  />
                </FieldContent>
                <FieldError />
              </FieldGroup>
            )}
          />
          <FieldRoot
            control={form.control}
            name="role"
            render={({ field }) => (
              <FieldGroup>
                <FieldLabel className="text-xs">Rôle</FieldLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FieldContent>
                    <SelectTrigger size="default" aria-label="Rôle" className="w-full">
                      <SelectValue placeholder="Sélectionner un rôle" />
                    </SelectTrigger>
                  </FieldContent>
                  <SelectContent>
                    {Object.entries(roleLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError />
              </FieldGroup>
            )}
          />
          {extraFields}
          {isEdit && lastLogin && (
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Dernière connexion</span>
              <span className="text-sm text-foreground">
                {new Date(lastLogin).toLocaleDateString('fr-FR', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          )}
          {!isEdit && (
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
                        placeholder="••••••••"
                        className="text-xs"
                        {...field}
                      />
                      <button
                        type="button"
                        onClick={togglePasswordVisibility}
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
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t bg-background px-6 py-4 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={mutation.isPending}
            size="lg"
          >
            Annuler
          </Button>
          <Button
            type="submit"
            disabled={mutation.isPending}
            size="lg"
            className="bg-(--color-primary) hover:bg-(--color-primary)/80"
          >
            {mutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            {mutation.isPending ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
        </div>
      </form>
    </Field>
  );
}
