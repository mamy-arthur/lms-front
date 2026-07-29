'use client';

import { Loader2, Save } from 'lucide-react';
import type { ReactNode } from 'react';
import type { FieldValues, UseFormReturn } from 'react-hook-form';
import type { Editor } from '@tiptap/react';
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
import { extractApiError } from '@/shared/utils/api-error';
import { RichTextEditor } from '@modules/shared/components/tiptap/RichTextEditor';

export interface MailTemplateFormProps {
  form: UseFormReturn<FieldValues>;
  mutation: MutationLike;
  isEdit: boolean;
  handleClose: () => void;
  onSubmit: (values: FieldValues) => void;
  extraFields?: ReactNode;
  toolbarExtras?: (editor: Editor) => ReactNode;
  /** Référence du template (affichée en lecture seule en mode édition). */
  reference?: string;
}

export function MailTemplateForm({
  form,
  mutation,
  isEdit,
  handleClose,
  onSubmit,
  extraFields,
  toolbarExtras,
  reference,
}: MailTemplateFormProps) {
  return (
    <Field {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-1 flex-col min-h-0"
        noValidate
      >
        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-4">
          {mutation.isError && (
            <div
              role="alert"
              className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {extractApiError(mutation.error, isEdit)}
            </div>
          )}

          {/* Nom */}
          <FieldRoot
            control={form.control}
            name="name"
            render={({ field }) => (
              <FieldGroup>
                <FieldLabel className="text-xs">Nom *</FieldLabel>
                <FieldContent>
                  <Input
                    autoFocus
                    aria-label="Nom"
                    className="text-xs"
                    placeholder="Ex : Confirmation d'inscription"
                    {...field}
                  />
                </FieldContent>
                <FieldError />
              </FieldGroup>
            )}
          />

          {/* Référence (lecture seule en mode édition) */}
          {isEdit && reference && (
            <div className="space-y-1">
              <label htmlFor="field-reference" className="text-xs font-medium">
                Référence
              </label>
              <Input
                id="field-reference"
                aria-label="Référence"
                className="text-xs bg-muted"
                value={reference}
                disabled
                readOnly
              />
            </div>
          )}

          {/* Sujet */}
          <FieldRoot
            control={form.control}
            name="subject"
            render={({ field }) => (
              <FieldGroup>
                <FieldLabel className="text-xs">Sujet *</FieldLabel>
                <FieldContent>
                  <Input
                    aria-label="Sujet"
                    className="text-xs"
                    placeholder="Ex : Bienvenue sur la plateforme"
                    {...field}
                  />
                </FieldContent>
                <FieldError />
              </FieldGroup>
            )}
          />

          {/* Statut */}
          <FieldRoot
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FieldGroup>
                <FieldLabel className="text-xs">Statut *</FieldLabel>
                <Select
                  onValueChange={(v) => field.onChange(v === 'true')}
                  value={String(field.value)}
                >
                  <FieldContent>
                    <SelectTrigger size="default" aria-label="Statut" className="w-full">
                      <SelectValue placeholder="Sélectionner un statut" />
                    </SelectTrigger>
                  </FieldContent>
                  <SelectContent>
                    <SelectItem value="true">Actif</SelectItem>
                    <SelectItem value="false">Inactif</SelectItem>
                  </SelectContent>
                </Select>
                <FieldError />
              </FieldGroup>
            )}
          />

          {/* Champs supplémentaires (ex : tenant) */}
          {extraFields}

          {/* Corps (WYSIWYG TipTap) */}
          <FieldRoot
            control={form.control}
            name="body"
            render={({ field }) => (
              <FieldGroup>
                <FieldLabel className="text-xs">Corps *</FieldLabel>
                <FieldContent>
                  <RichTextEditor
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    outputFormat="html"
                    placeholder="Rédigez le contenu du mail…"
                    toolbarExtras={toolbarExtras}
                  />
                </FieldContent>
                <FieldError />
              </FieldGroup>
            )}
          />
        </div>

        {/* Pied de page */}
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
