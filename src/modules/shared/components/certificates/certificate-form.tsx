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

export interface CertificateFormProps {
  form: UseFormReturn<FieldValues>;
  mutation: MutationLike;
  isEdit: boolean;
  handleClose: () => void;
  onSubmit: (values: FieldValues) => void;
  extraFields?: ReactNode;
  /** Boutons optionnels injectés à la fin de la toolbar TipTap. */
  toolbarExtras?: (editor: Editor) => ReactNode;
  /** Référence de l'attestation (affichée en lecture seule en mode édition). */
  reference?: string;
}

export function CertificateForm({
  form,
  mutation,
  isEdit,
  handleClose,
  onSubmit,
  extraFields,
  toolbarExtras,
  reference,
}: CertificateFormProps) {
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
                    placeholder="Ex : Attestation de réussite"
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
                    <SelectItem value="true">Oui</SelectItem>
                    <SelectItem value="false">Non</SelectItem>
                  </SelectContent>
                </Select>
                <FieldError />
              </FieldGroup>
            )}
          />

          {/* Modèle par défaut */}
          <FieldRoot
            control={form.control}
            name="isDefaultTemplate"
            render={({ field }) => (
              <FieldGroup>
                <FieldLabel className="text-xs">Définir comme modèle par défaut</FieldLabel>
                <Select
                  onValueChange={(v) => field.onChange(v === 'true')}
                  value={String(field.value)}
                >
                  <FieldContent>
                    <SelectTrigger size="default" aria-label="Modèle par défaut" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FieldContent>
                  <SelectContent>
                    <SelectItem value="true">Oui</SelectItem>
                    <SelectItem value="false">Non</SelectItem>
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
                    placeholder="Rédigez le contenu de l'attestation…"
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
