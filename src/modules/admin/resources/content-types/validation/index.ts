import { z } from 'zod';

const SNAKE_CASE_REGEX = /^[a-z][a-z0-9]*(_[a-z0-9]+)*$/;

export const fieldFormSchema = z.object({
  /**
   * Internal flag to distinguish fields freshly added in the UI (no backend id)
   * from fields loaded from the backend. Stripped before API calls.
   */
  _isNew: z.boolean(),
  type: z.enum(
    ['text', 'textarea', 'richtext', 'number', 'date', 'select', 'checkbox', 'media', 'relation'],
    { error: 'Type requis' },
  ),
  name: z
    .string()
    .min(1, 'Nom requis')
    .regex(SNAKE_CASE_REGEX, 'Le nom doit être en snake_case (ex: mon_champ)'),
  label: z.string().min(1, 'Label requis'),
  required: z.boolean(),
  is_archived: z.boolean(),
  // Media-specific (only validated when type === 'media')
  accept: z.array(z.string()).optional(),
  max_size_mb: z.number().positive().optional(),
  multiple: z.boolean().optional(),
});

export const contentTypeSchema = z.object({
  module_type: z.enum(['page', 'file', 'folder', 'url', 'media', 'scorm'], {
    error: 'Module requis',
  }),
  title: z.string().min(1, 'Titre requis').max(255),
  description: z.string().optional(),
  fields: z.array(fieldFormSchema).superRefine((fields, ctx) => {
    const seen = new Set<string>();
    fields.forEach((field, index) => {
      if (!field.name) return;
      if (seen.has(field.name)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Le nom "${field.name}" est déjà utilisé`,
          path: [index, 'name'],
        });
      }
      seen.add(field.name);
    });
  }),
});

export type ContentTypeFormValues = z.infer<typeof contentTypeSchema>;
export type FieldFormValues = z.infer<typeof fieldFormSchema>;
