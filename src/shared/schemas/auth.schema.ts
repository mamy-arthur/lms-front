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

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 255;

/** Reprend la politique appliquée par le backend (PasswordPolicy + règle Laravel `Password`). */
export const passwordPolicySchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Minimum ${PASSWORD_MIN_LENGTH} caractères`)
  .max(PASSWORD_MAX_LENGTH, `Maximum ${PASSWORD_MAX_LENGTH} caractères`)
  .regex(/[a-z]/, 'Au moins une minuscule')
  .regex(/[A-Z]/, 'Au moins une majuscule')
  .regex(/\d/, 'Au moins un chiffre');

/** Énonce `passwordPolicySchema` à l'utilisateur : à mettre à jour avec lui. */
export const PASSWORD_POLICY_HINT = `Choisissez un mot de passe d'au moins ${PASSWORD_MIN_LENGTH} caractères, avec une majuscule, une minuscule et un chiffre.`;

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
  password: passwordPolicySchema,
  role: z.enum(['SUPER_ADMIN', 'EDITOR', 'CLIENT_MANAGER', 'TRAINEE']),
  tenant_id: z.string().uuid().nullable().optional(),
  editor_id: z.string().uuid().nullable().optional(),
  is_active: z.boolean().default(true),
});

export type CreateUserSchema = z.infer<typeof createUserSchema>;
