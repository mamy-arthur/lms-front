import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string(),
  password: z.string(),
});

export type LoginSchema = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email('Email invalide'),
});

export type ForgotPasswordSchema = z.infer<typeof forgotPasswordSchema>;

/** Reprend la politique appliquée par le backend (PasswordPolicy + règle Laravel `Password`). */
export const passwordPolicySchema = z
  .string()
  .min(8, 'Minimum 8 caractères')
  .max(255, 'Maximum 255 caractères')
  .regex(/[a-z]/, 'Au moins une minuscule')
  .regex(/[A-Z]/, 'Au moins une majuscule')
  .regex(/\d/, 'Au moins un chiffre');

export const resetPasswordSchema = z
  .object({
    email: z.string().email('Email invalide'),
    token: z.string().min(1, 'Token requis'),
    password: passwordPolicySchema,
    password_confirmation: z.string().min(1, 'Confirmation requise'),
  })
  .refine((d) => d.password === d.password_confirmation, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['password_confirmation'],
  });

export type ResetPasswordSchema = z.infer<typeof resetPasswordSchema>;

export const createUserSchema = z.object({
  first_name: z.string().min(1, 'Prénom requis').max(120),
  last_name: z.string().min(1, 'Nom requis').max(120),
  email: z.string().email('Email invalide').max(255),
  password: z.string().min(8, 'Minimum 8 caractères').max(255),
  role: z.enum(['SUPER_ADMIN', 'EDITOR', 'CLIENT_MANAGER', 'TRAINEE']),
  tenant_id: z.string().uuid().nullable().optional(),
  editor_id: z.string().uuid().nullable().optional(),
  is_active: z.boolean().default(true),
});

export type CreateUserSchema = z.infer<typeof createUserSchema>;

export const createTenantSchema = z.object({
  editor_name: z.string().min(1, 'Nom éditeur requis').max(255),
  editor_slug: z
    .string()
    .max(255)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug invalide')
    .optional(),
  client_name: z.string().min(1, 'Nom client requis').max(255),
  client_slug: z
    .string()
    .max(255)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug invalide')
    .optional(),
  tenant_name: z.string().min(1, 'Nom tenant requis').max(255),
  tenant_slug: z
    .string()
    .max(255)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug invalide')
    .optional(),
  subdomain: z
    .string()
    .max(255)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Sous-domaine invalide')
    .optional(),
  domain: z.string().max(255).optional(),
  is_active: z.boolean().default(true),
});

export type CreateTenantSchema = z.infer<typeof createTenantSchema>;
