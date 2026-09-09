'use client';

import * as React from 'react';
import { Loader2, Save, TriangleAlert } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  TWO_FACTOR_BOUNDS,
  type NumericSettingKey,
  type TenantTemplateMail,
  type TwoFactorSettings,
  type TwoFactorSettingsPayload,
} from '../../types';

const NUMERIC_FIELDS: { key: NumericSettingKey; label: string; hint: string }[] = [
  { key: 'code_length', label: 'Longueur du code', hint: 'chiffres' },
  { key: 'ttl_minutes', label: 'Durée de validité', hint: 'minutes' },
  { key: 'resend_cooldown_seconds', label: 'Délai avant renvoi', hint: 'secondes' },
  { key: 'max_attempts', label: 'Tentatives max par code', hint: 'tentatives' },
  { key: 'lockout_threshold', label: 'Seuil de blocage du compte', hint: 'codes verrouillés' },
  { key: 'trusted_device_days', label: 'Validité appareil de confiance', hint: 'jours' },
];

const NO_TEMPLATE = 'none';

interface TwoFactorSettingsFormProps {
  settings: TwoFactorSettings;
  scope: 'global' | 'tenant';
  templateMails?: TenantTemplateMail[];
  isSaving: boolean;
  onSubmit: (payload: TwoFactorSettingsPayload) => void;
}

interface FieldState {
  inherited: boolean;
  value: number;
}

export function TwoFactorSettingsForm({
  settings,
  scope,
  templateMails = [],
  isSaving,
  onSubmit,
}: TwoFactorSettingsFormProps) {
  const inheritLabel = scope === 'tenant' ? 'Hériter du global' : 'Valeur par défaut';

  const [fields, setFields] = React.useState<Record<NumericSettingKey, FieldState>>(() =>
    buildFieldState(settings),
  );
  const [enabled, setEnabled] = React.useState(settings.effective.enabled);
  const [templateMailId, setTemplateMailId] = React.useState<string | null>(
    settings.overrides.template_mail_id,
  );
  const [errors, setErrors] = React.useState<Partial<Record<NumericSettingKey, string>>>({});

  // Le formulaire est remonté à chaque changement d'onglet ou de tenant.
  React.useEffect(() => {
    setFields(buildFieldState(settings));
    setEnabled(settings.effective.enabled);
    setTemplateMailId(settings.overrides.template_mail_id);
    setErrors({});
  }, [settings]);

  const updateField = (key: NumericSettingKey, patch: Partial<FieldState>) => {
    setFields((previous) => ({ ...previous, [key]: { ...previous[key], ...patch } }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const nextErrors = validate(fields);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    // En portée tenant, renvoyer `enabled` alors qu'il était hérité créerait une
    // surcharge implicite qui figerait le tenant sur la valeur globale du moment.
    const keepsInheritedEnabled =
      scope === 'tenant' &&
      settings.overrides.enabled === null &&
      enabled === settings.effective.enabled;

    const payload: TwoFactorSettingsPayload = { enabled: keepsInheritedEnabled ? null : enabled };

    for (const { key } of NUMERIC_FIELDS) {
      payload[key] = fields[key].inherited ? null : fields[key].value;
    }

    if (scope === 'tenant') {
      payload.template_mail_id = templateMailId;
    }

    onSubmit(payload);
  };

  const willEnable = enabled && !settings.effective.enabled;

  return (
    // noValidate : min/max servent aux incréments du champ, la validation et les
    // messages restent les nôtres plutôt que les infobulles natives du navigateur.
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <div className="flex items-center justify-between rounded-lg border p-4">
        <div className="space-y-0.5">
          <Label htmlFor="two-factor-enabled" className="text-base">
            Activer la vérification en deux étapes
          </Label>
          <p className="text-sm text-muted-foreground">
            Un code est envoyé par e-mail à chaque connexion.
          </p>
        </div>
        <Switch
          id="two-factor-enabled"
          checked={enabled}
          onCheckedChange={setEnabled}
          className="data-checked:bg-(--color-primary)"
        />
      </div>

      {willEnable && (
        <div
          role="alert"
          className="flex gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800"
        >
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          <p>Tous les utilisateurs concernés devront saisir un code à chaque connexion.</p>
        </div>
      )}

      <div className="space-y-4">
        {NUMERIC_FIELDS.map(({ key, label, hint }) => {
          const bounds = TWO_FACTOR_BOUNDS[key];
          const field = fields[key];

          return (
            <div key={key} className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
              <div className="space-y-1">
                <Label htmlFor={`field-${key}`}>{label}</Label>

                {field.inherited ? (
                  <p className="text-xs text-muted-foreground">
                    Hérité : {settings.effective[key]} {hint}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Entre {bounds.min} et {bounds.max} {hint}
                  </p>
                )}

                {errors[key] && (
                  <p role="alert" className="text-xs text-red-500">
                    {errors[key]}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3">
                <Input
                  id={`field-${key}`}
                  type="number"
                  min={bounds.min}
                  max={bounds.max}
                  className="w-24"
                  disabled={field.inherited}
                  value={field.inherited ? settings.effective[key] : field.value}
                  onChange={(event) => updateField(key, { value: Number(event.target.value) })}
                  aria-invalid={errors[key] !== undefined || undefined}
                />

                <div className="flex items-center gap-2">
                  <Switch
                    id={`inherit-${key}`}
                    className="data-checked:bg-(--color-primary)"
                    checked={field.inherited}
                    onCheckedChange={(checked) =>
                      updateField(key, {
                        inherited: checked,
                        ...(checked ? {} : { value: settings.effective[key] }),
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
        })}
      </div>

      {scope === 'tenant' && (
        <div className="space-y-2">
          <Label htmlFor="template-mail">Template du mail OTP</Label>

          <Select
            value={templateMailId ?? NO_TEMPLATE}
            onValueChange={(value) => setTemplateMailId(value === NO_TEMPLATE ? null : value)}
          >
            <SelectTrigger id="template-mail" className="w-full sm:w-96">
              <SelectValue placeholder="Modèle par défaut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_TEMPLATE}>Modèle par défaut</SelectItem>
              {templateMails.map((template) => (
                <SelectItem key={template.id} value={template.id}>
                  {template.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <p className="text-xs text-muted-foreground">
            Sans template, le mail utilise le modèle par défaut traduit dans la langue de
            l’utilisateur.
          </p>
        </div>
      )}

      <Button
        type="submit"
        disabled={isSaving}
        className="bg-(--color-primary) hover:bg-(--color-primary)/80"
      >
        {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
        Enregistrer
      </Button>
    </form>
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
