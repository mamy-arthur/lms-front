/** Champs surchargeables des paramètres 2FA, interrupteur d'activation compris. */
export interface TwoFactorSettingsFields {
  enabled: boolean;
  code_length: number;
  ttl_minutes: number;
  resend_cooldown_seconds: number;
  max_attempts: number;
  lockout_threshold: number;
  trusted_device_days: number;
  template_mail_id: string | null;
}

/**
 * `overrides` ne contient que ce qui est explicitement défini à ce niveau —
 * `null` signifie « hérité ». `effective` est la valeur réellement appliquée.
 */
export interface TwoFactorSettings {
  tenant_id: string | null;
  overrides: { [K in keyof TwoFactorSettingsFields]: TwoFactorSettingsFields[K] | null };
  effective: TwoFactorSettingsFields;
  updated_by: string | null;
  updated_at: string | null;
}

/** `null` sur un champ supprime la surcharge et rétablit l'héritage. */
export type TwoFactorSettingsPayload = {
  [K in keyof TwoFactorSettingsFields]?: TwoFactorSettingsFields[K] | null;
};

/** Projection réduite renvoyée par GET /platform/tenants/{id}/template-mails. */
export interface TenantTemplateMail {
  id: string;
  reference: string | null;
  name: string;
  subject: string;
  status: boolean;
}

/** Bornes imposées par le backend (UpdateTwoFactorSettingsRequest). */
export const TWO_FACTOR_BOUNDS = {
  code_length: { min: 6, max: 10 },
  ttl_minutes: { min: 1, max: 60 },
  resend_cooldown_seconds: { min: 15, max: 600 },
  max_attempts: { min: 1, max: 20 },
  lockout_threshold: { min: 1, max: 50 },
  trusted_device_days: { min: 1, max: 365 },
} as const;

export type NumericSettingKey = keyof typeof TWO_FACTOR_BOUNDS;
