import { z } from 'zod';
import type { ContentTypeField } from '@/shared/types/content-type.types';

const REQUIRED_MSG = 'Ce champ est obligatoire';

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}

function fieldSchema(field: ContentTypeField): z.ZodTypeAny {
  const req = field.required;

  switch (field.type) {
    case 'text':
    case 'textarea':
    case 'select':
    case 'relation': {
      const base = z.string();
      return req ? base.min(1, REQUIRED_MSG) : base;
    }

    case 'richtext':
      return req ? z.string().refine((v) => stripHtml(v).length > 0, REQUIRED_MSG) : z.string();

    case 'number': {
      // Coerce '' (initial empty) and NaN to undefined so optional fields don't fail validation
      const coerce = (v: unknown) =>
        v === '' || (typeof v === 'number' && Number.isNaN(v)) ? undefined : v;
      return req
        ? z.preprocess(coerce, z.number({ error: REQUIRED_MSG }))
        : z.preprocess(coerce, z.number({ error: REQUIRED_MSG }).optional());
    }

    case 'date': {
      const base = z.string();
      return req ? base.min(1, REQUIRED_MSG) : base;
    }

    case 'checkbox':
      // Initial value is '' when no initialData is provided — coerce to false
      return z.preprocess((v) => (v === '' ? false : v), z.boolean());

    case 'media':
      if (field.multiple) {
        // onChange emits null when all items are removed
        const base = z.array(z.string()).nullable();
        return req ? base.refine((v) => Array.isArray(v) && v.length > 0, REQUIRED_MSG) : base;
      }
      return req
        ? z
            .string()
            .nullable()
            .refine((v) => v !== null && v !== '', REQUIRED_MSG)
        : z.string().nullable();

    default:
      return z.unknown();
  }
}

export function buildContentSchema(fields: ContentTypeField[]) {
  const shape = Object.fromEntries(
    fields.filter((f) => !f.is_archived).map((f) => [f.name, fieldSchema(f)]),
  );
  return z.object(shape);
}
