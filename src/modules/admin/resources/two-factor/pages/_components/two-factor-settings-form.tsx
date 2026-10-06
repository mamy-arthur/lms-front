'use client';

import {
  Check,
  KeyRound,
  Loader2,
  Mail,
  MonitorCheck,
  RotateCcw,
  Save,
  ShieldCheck,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react';
import * as React from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  type NumericSettingKey,
  type TenantTemplateMail,
  TWO_FACTOR_BOUNDS,
  type TwoFactorSettings,
  type TwoFactorSettingsFields,
  type TwoFactorSettingsPayload,
} from '../../types';

const NUMERIC_FIELDS: {
  key: NumericSettingKey;
  label: string;
  hint: string;
}[] = [
  { key: 'code_length', label: 'Longueur du code', hint: 'chiffres' },
  { key: 'ttl_minutes', label: 'Durée de validité', hint: 'minutes' },
  {
    key: 'resend_cooldown_seconds',
    label: 'Délai avant renvoi',
    hint: 'secondes',
  },
  { key: 'max_attempts', label: 'Tentatives max par code', hint: 'tentatives' },
  {
    key: 'lockout_threshold',
    label: 'Seuil de blocage du compte',
    hint: 'codes verrouillés',
  },
  {
    key: 'trusted_device_days',
    label: 'Validité appareil de confiance',
    hint: 'jours',
  },
];

const NO_TEMPLATE = 'none';

const FIELD_GROUPS: {
  title: string;
  icon: LucideIcon;
  keys: NumericSettingKey[];
}[] = [
  {
    title: 'Code de connexion',
    icon: KeyRound,
    keys: ['code_length', 'ttl_minutes', 'resend_cooldown_seconds'],
  },
  { title: 'Protection du compte', icon: ShieldCheck, keys: ['max_attempts', 'lockout_threshold'] },
  { title: 'Appareils de confiance', icon: MonitorCheck, keys: ['trusted_device_days'] },
];

interface TwoFactorSettingsFormProps {
  settings: TwoFactorSettings;
  scope: 'global' | 'tenant';
  scopeLabel?: string;
  inheritedValues?: TwoFactorSettingsFields;
  templateMails?: TenantTemplateMail[];
  templatesLoading?: boolean;
  templatesError?: boolean;
  onRetryTemplates?: () => void;
  isSaving: boolean;
  onDirtyChange?: (dirty: boolean) => void;
  onSubmit: (payload: TwoFactorSettingsPayload) => void;
}

interface FieldState {
  inherited: boolean;
  value: number;
}

export function TwoFactorSettingsForm({
  settings,
  scope,
  scopeLabel = scope === 'global' ? 'Ensemble de la plateforme' : 'Tenant sélectionné',
  inheritedValues,
  templateMails = [],
  templatesLoading = false,
  templatesError = false,
  onRetryTemplates,
  isSaving,
  onDirtyChange,
  onSubmit,
}: TwoFactorSettingsFormProps) {
  const inheritLabel = scope === 'tenant' ? 'Hériter du global' : 'Valeur par défaut';

  const [fields, setFields] = React.useState<Record<NumericSettingKey, FieldState>>(() =>
    buildFieldState(settings),
  );
  const [enabled, setEnabled] = React.useState(settings.effective.enabled);
  const [enabledInherited, setEnabledInherited] = React.useState(
    scope === 'tenant' && settings.overrides.enabled === null,
  );
  const [templateMailId, setTemplateMailId] = React.useState<string | null>(
    settings.overrides.template_mail_id,
  );
  const [errors, setErrors] = React.useState<Partial<Record<NumericSettingKey, string>>>({});

  const effectiveEnabled = enabledInherited
    ? (inheritedValues?.enabled ?? settings.effective.enabled)
    : enabled;
  const isDirty =
    enabledInherited !== (scope === 'tenant' && settings.overrides.enabled === null) ||
    (!enabledInherited && enabled !== settings.effective.enabled) ||
    (scope === 'tenant' && templateMailId !== settings.overrides.template_mail_id) ||
    NUMERIC_FIELDS.some(({ key }) => {
      const field = fields[key];
      return field.inherited
        ? settings.overrides[key] !== null
        : settings.overrides[key] === null || field.value !== settings.overrides[key];
    });

  React.useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  React.useEffect(() => {
    if (!isDirty) return;
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warnBeforeUnload);
    return () => window.removeEventListener('beforeunload', warnBeforeUnload);
  }, [isDirty]);

  const inheritedValue = (key: NumericSettingKey) =>
    inheritedValues?.[key] ??
    (settings.overrides[key] === null ? settings.effective[key] : undefined);

  const reset = () => {
    setFields(buildFieldState(settings));
    setEnabled(settings.effective.enabled);
    setEnabledInherited(scope === 'tenant' && settings.overrides.enabled === null);
    setTemplateMailId(settings.overrides.template_mail_id);
    setErrors({});
  };

  const updateField = (key: NumericSettingKey, patch: Partial<FieldState>) => {
    setFields((previous) => ({
      ...previous,
      [key]: { ...previous[key], ...patch },
    }));
    setErrors((previous) => ({ ...previous, [key]: undefined }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!isDirty || isSaving) return;

    const nextErrors = validate(fields);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    const payload: TwoFactorSettingsPayload = {
      enabled: enabledInherited ? null : enabled,
    };

    for (const { key } of NUMERIC_FIELDS) {
      payload[key] = fields[key].inherited ? null : fields[key].value;
    }

    if (scope === 'tenant' && templateMailId !== settings.overrides.template_mail_id) {
      payload.template_mail_id = templateMailId;
    }

    onSubmit(payload);
  };

  const activationChanged = effectiveEnabled !== settings.effective.enabled;

  return (
    // noValidate : min/max servent aux incréments du champ, la validation et les
    // messages restent les nôtres plutôt que les infobulles natives du navigateur.
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-5 border-y py-5">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant={settings.effective.enabled ? 'secondary' : 'outline'}
              className={
                settings.effective.enabled ? 'bg-(--color-primary)/10 text-(--color-primary)' : ''
              }
            >
              {settings.effective.enabled ? '2FA activée' : '2FA désactivée'}
            </Badge>
            <span className="text-xs text-muted-foreground">{scopeLabel}</span>
          </div>
          <Label htmlFor="two-factor-enabled" className="text-base">
            Activer la vérification en deux étapes
          </Label>
          <p className="text-sm text-muted-foreground">
            Code par e-mail, sauf pour les appareils de confiance.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-5">
          {scope === 'tenant' && (
            <div className="flex items-center gap-2">
              <Switch
                id="inherit-enabled"
                className="data-checked:bg-(--color-primary)"
                checked={enabledInherited}
                disabled={isSaving || (!enabledInherited && !inheritedValues)}
                onCheckedChange={(checked) => {
                  setEnabled(effectiveEnabled);
                  setEnabledInherited(checked);
                }}
              />
              <Label htmlFor="inherit-enabled" className="text-xs font-normal">
                Hériter de l’activation globale
              </Label>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {scope === 'tenant'
                ? enabledInherited
                  ? 'Hérité'
                  : 'Personnalisé'
                : settings.overrides.enabled === null && enabled === settings.effective.enabled
                  ? 'Par défaut'
                  : 'Personnalisé'}
            </Badge>
            <Switch
              id="two-factor-enabled"
              checked={effectiveEnabled}
              disabled={isSaving || enabledInherited}
              onCheckedChange={setEnabled}
              className="data-checked:bg-(--color-primary)"
            />
          </div>
        </div>
      </div>

      {activationChanged && (
        <div
          role="alert"
          className="flex gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800"
        >
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          <p>
            {effectiveEnabled
              ? `Après enregistrement, les utilisateurs concernés devront saisir un code à la connexion, sauf sur un appareil de confiance. Périmètre : ${scopeLabel}.`
              : `Après enregistrement, aucun code ne sera demandé aux utilisateurs concernés. Périmètre : ${scopeLabel}.`}
          </p>
        </div>
      )}

      <div className="grid min-w-0 gap-5 lg:grid-cols-2">
        {FIELD_GROUPS.map((group) => (
          <SettingsCard
            key={group.title}
            title={group.title}
            icon={group.icon}
            status={
              group.keys.every((key) => fields[key].inherited)
                ? scope === 'tenant'
                  ? 'Hérité'
                  : 'Par défaut'
                : 'Personnalisé'
            }
          >
            {NUMERIC_FIELDS.filter(({ key }) => group.keys.includes(key)).map(
              ({ key, label, hint }) => {
                const bounds = TWO_FACTOR_BOUNDS[key];
                const field = fields[key];

                return (
                  <div key={key} className="space-y-3 py-4 first:pt-0 last:pb-0">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Label htmlFor={`field-${key}`}>{label}</Label>
                        <Badge variant="secondary">
                          {field.inherited
                            ? scope === 'tenant'
                              ? 'Hérité'
                              : 'Par défaut'
                            : 'Personnalisé'}
                        </Badge>
                      </div>

                      {field.inherited ? (
                        <p id={`hint-${key}`} className="text-xs text-muted-foreground">
                          {inheritedValue(key) === undefined
                            ? 'Valeur par défaut appliquée après enregistrement'
                            : `${scope === 'tenant' ? 'Hérité' : 'Par défaut'} : ${inheritedValue(key)} ${hint}`}
                        </p>
                      ) : (
                        <p id={`hint-${key}`} className="text-xs text-muted-foreground">
                          Entre {bounds.min} et {bounds.max} {hint}
                        </p>
                      )}

                      {errors[key] && (
                        <p id={`error-${key}`} role="alert" className="text-xs text-destructive">
                          {errors[key]}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Input
                          id={`field-${key}`}
                          type="number"
                          min={bounds.min}
                          max={bounds.max}
                          className="w-24"
                          disabled={isSaving || field.inherited}
                          value={
                            field.inherited
                              ? (inheritedValue(key) ?? '')
                              : Number.isNaN(field.value)
                                ? ''
                                : field.value
                          }
                          onChange={(event) =>
                            updateField(key, { value: Number(event.target.value) })
                          }
                          aria-invalid={errors[key] !== undefined || undefined}
                          aria-describedby={`hint-${key}${errors[key] ? ` error-${key}` : ''}`}
                        />
                        <span className="text-xs text-muted-foreground">{hint}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Switch
                          id={`inherit-${key}`}
                          className="data-checked:bg-(--color-primary)"
                          disabled={isSaving}
                          checked={field.inherited}
                          onCheckedChange={(checked) =>
                            updateField(key, {
                              inherited: checked,
                              ...(checked
                                ? {}
                                : { value: inheritedValue(key) ?? settings.effective[key] }),
                            })
                          }
                        />
                        <Label htmlFor={`inherit-${key}`} className="text-xs font-normal">
                          {inheritLabel}
                        </Label>
                      </div>
                    </div>
                  </div>
                );
              },
            )}
          </SettingsCard>
        ))}

        <SettingsCard
          title="E-mail de vérification"
          icon={Mail}
          status={scope === 'tenant' && templateMailId ? 'Personnalisé' : 'Par défaut'}
        >
          {scope === 'tenant' ? (
            <div className="space-y-3">
              <Label htmlFor="template-mail">Modèle de l’e-mail</Label>

              {templatesLoading ? (
                <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  Chargement des modèles…
                </p>
              ) : templatesError ? (
                <div role="alert" className="space-y-2">
                  <p className="text-sm text-destructive">
                    Impossible de charger les modèles d’e-mail.
                  </p>
                  <Button type="button" variant="outline" size="sm" onClick={onRetryTemplates}>
                    <RotateCcw className="size-4" />
                    Réessayer
                  </Button>
                </div>
              ) : null}

              <Select
                value={templateMailId ?? NO_TEMPLATE}
                disabled={isSaving || templatesLoading || templatesError}
                onValueChange={(value) => setTemplateMailId(value === NO_TEMPLATE ? null : value)}
              >
                <SelectTrigger id="template-mail" className="w-full min-w-0">
                  <SelectValue placeholder="Modèle par défaut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_TEMPLATE}>Modèle par défaut</SelectItem>
                  {templateMailId &&
                    !templateMails.some((template) => template.id === templateMailId) && (
                      <SelectItem value={templateMailId} disabled>
                        Modèle enregistré indisponible
                      </SelectItem>
                    )}
                  {templateMails.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <p className="text-xs text-muted-foreground">
                Sans modèle personnalisé, le mail utilise le modèle par défaut traduit dans la
                langue de l’utilisateur.
              </p>
              {!templatesLoading && !templatesError && templateMails.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Aucun modèle personnalisé disponible pour ce tenant.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm font-medium">Modèle par défaut</p>
              <p className="text-sm text-muted-foreground">
                E-mail traduit dans la langue de l’utilisateur.
              </p>
            </div>
          )}
        </SettingsCard>
      </div>

      <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-3 border-t bg-background/95 py-4 backdrop-blur-sm">
        <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
          {isSaving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : !isDirty ? (
            <Check className="size-4" />
          ) : null}
          {isSaving
            ? 'Enregistrement en cours…'
            : isDirty
              ? 'Modifications non enregistrées'
              : 'Aucune modification en attente'}
        </p>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" disabled={isSaving || !isDirty} onClick={reset}>
            <RotateCcw className="size-4" />
            Annuler
          </Button>
          <Button
            type="submit"
            disabled={isSaving || !isDirty}
            className="bg-(--color-primary) hover:bg-(--color-primary)/80"
          >
            {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Enregistrer
          </Button>
        </div>
      </div>
    </form>
  );
}

function SettingsCard({
  title,
  icon: Icon,
  status,
  children,
}: {
  title: string;
  icon: LucideIcon;
  status: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="min-w-0 gap-0 py-0 shadow-sm">
      <CardHeader className="flex flex-wrap items-center gap-3 border-b bg-(--color-primary)/5 p-5">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-(--color-primary)/10 text-(--color-primary)">
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <h2 className="min-w-0 flex-1 text-sm font-semibold">{title}</h2>
        <Badge variant="outline">{status}</Badge>
      </CardHeader>
      <CardContent className="divide-y px-5 py-5">{children}</CardContent>
    </Card>
  );
}

function buildFieldState(settings: TwoFactorSettings): Record<NumericSettingKey, FieldState> {
  const state = {} as Record<NumericSettingKey, FieldState>;

  for (const { key } of NUMERIC_FIELDS) {
    const override = settings.overrides[key];

    state[key] = {
      inherited: override === null,
      value: override ?? settings.effective[key],
    };
  }

  return state;
}

function validate(
  fields: Record<NumericSettingKey, FieldState>,
): Partial<Record<NumericSettingKey, string>> {
  const errors: Partial<Record<NumericSettingKey, string>> = {};

  for (const { key } of NUMERIC_FIELDS) {
    const field = fields[key];
    if (field.inherited) continue;

    const { min, max } = TWO_FACTOR_BOUNDS[key];

    if (!Number.isInteger(field.value) || field.value < min || field.value > max) {
      errors[key] = `La valeur doit être comprise entre ${min} et ${max}.`;
    }
  }

  return errors;
}
