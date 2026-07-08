'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';
import { MODULE_TYPES, type ContentType } from '../../types';
import { contentTypeSchema, type ContentTypeFormValues } from '../../validation';
import { useCreateContentType } from '../../hooks/useCreateContentType';
import { useUpdateContentType } from '../../hooks/useUpdateContentType';
import { SchemaBuilder } from './schema-builder';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Maps a persisted ContentType to form values.
 * Fields loaded from the backend have `_isNew: false`.
 */
function toFormValues(ct: ContentType): ContentTypeFormValues {
  return {
    module_type: ct.module_type,
    title: ct.title,
    description: ct.description ?? '',
    fields: ct.fields.map((f) => ({
      _isNew: false,
      type: f.type,
      name: f.name,
      label: f.label,
      required: f.required,
      is_archived: f.is_archived,
      accept: f.accept ?? undefined,
      max_size_mb: f.max_size_mb ?? undefined,
      multiple: f.multiple ?? undefined,
    })),
  };
}

const DEFAULT_VALUES: ContentTypeFormValues = {
  module_type: 'page',
  title: '',
  description: '',
  fields: [],
};

// ─── Props ───────────────────────────────────────────────────────────────────

interface ContentTypeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present when editing an existing content type. */
  contentType?: ContentType;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ContentTypeForm({ open, onOpenChange, contentType }: ContentTypeFormProps) {
  const isEdit = !!contentType;
  const existingFieldCount = contentType?.fields.length ?? 0;

  const createMutation = useCreateContentType();
  const updateMutation = useUpdateContentType();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const form = useForm<ContentTypeFormValues>({
    resolver: zodResolver(contentTypeSchema),
    defaultValues: contentType ? toFormValues(contentType) : DEFAULT_VALUES,
  });

  // Re-populate form when the contentType changes (e.g. switching between edit targets)
  useEffect(() => {
    if (open) {
      form.reset(contentType ? toFormValues(contentType) : DEFAULT_VALUES);
    }
  }, [open, contentType, form]);

  const handleSubmit = form.handleSubmit((values) => {
    // Strip the internal `_isNew` flag before sending to the API
    const fields = values.fields.map(({ _isNew: _flag, ...rest }) => rest);
    const payload = {
      module_type: values.module_type,
      title: values.title,
      description: values.description,
      fields,
    };

    if (isEdit && contentType) {
      updateMutation.mutate(
        { id: contentType.id, payload },
        {
          onSuccess: () => {
            toast.success('Content Type mis à jour');
            onOpenChange(false);
          },
          onError: () => toast.error('Erreur lors de la mise à jour'),
        },
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          toast.success('Content Type créé');
          onOpenChange(false);
        },
        onError: () => toast.error('Erreur lors de la création'),
      });
    }
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl p-0 flex flex-col">
        <SheetHeader className="px-6 py-5 border-b shrink-0">
          <SheetTitle>{isEdit ? 'Modifier le Content Type' : 'Créer un Content Type'}</SheetTitle>
          <SheetDescription>
            {isEdit
              ? 'Modifiez les informations et le schéma de champs.'
              : 'Définissez le module, le titre et construisez le schéma de champs.'}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
            <ScrollArea className="flex-1">
              <div className="px-6 py-5 space-y-8">
                {/* ── General information ──────────────────────────────── */}
                <section className="space-y-4">
                  <div>
                    <h2 className="text-sm font-semibold">Informations générales</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Identité du content type.
                    </p>
                  </div>

                  {/* Module type */}
                  <FormField
                    control={form.control}
                    name="module_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Module</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={isEdit}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner un module" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {MODULE_TYPES.map((m) => (
                              <SelectItem key={m.value} value={m.value}>
                                {m.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {isEdit && (
                          <p className="text-xs text-muted-foreground">
                            Le module ne peut pas être modifié.
                          </p>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Title */}
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Titre</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex : Fiche pédagogique" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Description */}
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Description optionnelle du content type…"
                            className="resize-none"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </section>

                <Separator />

                {/* ── Schema Builder ───────────────────────────────────── */}
                <section>
                  <SchemaBuilder control={form.control} existingFieldCount={existingFieldCount} />
                </section>
              </div>
            </ScrollArea>

            {/* ── Footer ──────────────────────────────────────────────── */}
            <div className="border-t px-6 py-4 flex items-center justify-end gap-3 shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="size-4 animate-spin" />}
                {isEdit ? 'Enregistrer les modifications' : 'Créer le Content Type'}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
