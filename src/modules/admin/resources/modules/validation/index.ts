import { z } from 'zod';

export const moduleSchema = z.object({
  shortname: z.string().min(1, 'Nom requis').max(255),
  idnumber: z.string().min(1, 'Identifiant requis').max(60),
  description: z.string().max(2000).optional().or(z.literal('')),
  category_id: z.string().min(1, 'Catégorie requise'),
  courseIds: z.array(z.string()),
});

export type ModuleFormValues = z.infer<typeof moduleSchema>;

export const MODULE_FORM_DEFAULTS: ModuleFormValues = {
  shortname: '',
  idnumber: '',
  description: '',
  category_id: '',
  courseIds: [],
};
