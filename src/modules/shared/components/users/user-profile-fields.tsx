'use client';

import { useWatch, type UseFormReturn } from 'react-hook-form';
import { FieldContent, FieldError, FieldGroup, FieldLabel, FieldRoot } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { COUNTRIES } from '@/shared/constants/countries';
import { LANGUAGES } from '@/shared/constants/languages';
import { TIMEZONES } from '@/shared/constants/timezones';
import { AddressAutocomplete } from './address-autocomplete';

interface ProfileFormValues {
  country?: string | null;
  address?: string | null;
  zip_code?: string | null;
  city?: string | null;
  biography?: string | null;
  timezone?: string | null;
  preferred_language?: string | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function UserProfileFields({ form }: { form: UseFormReturn<any> }) {
  const country = useWatch({ control: form.control, name: 'country' }) as string | null | undefined;

  return (
    <>
      <Separator className="my-1" />

      {/* ── Adresse ── */}
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Adresse
      </p>

      {/* Pays — obligatoire en premier pour activer l'autocomplétion */}
      <FieldRoot
        control={form.control}
        name="country"
        render={({ field }) => (
          <FieldGroup>
            <FieldLabel className="text-xs">Pays</FieldLabel>
            <Select
              onValueChange={(v) => {
                field.onChange(v === '__none__' ? null : v);
                // Réinitialise l'adresse si le pays change
                form.setValue('address', '');
                form.setValue('zip_code', '');
                form.setValue('city', '');
              }}
              value={field.value ?? '__none__'}
            >
              <FieldContent>
                <SelectTrigger size="default" aria-label="Pays" className="w-full text-xs">
                  <SelectValue placeholder="Sélectionner un pays" />
                </SelectTrigger>
              </FieldContent>
              <SelectContent>
                <SelectItem value="__none__">— Non renseigné</SelectItem>
                {COUNTRIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError />
          </FieldGroup>
        )}
      />

      {/* Adresse — autocomplétion Google activée si pays renseigné */}
      <FieldRoot
        control={form.control}
        name="address"
        render={({ field }) => (
          <FieldGroup>
            <FieldLabel className="text-xs">
              Adresse
              {!country && (
                <span className="ml-1 text-muted-foreground font-normal">
                  (sélectionnez un pays d'abord)
                </span>
              )}
            </FieldLabel>
            <FieldContent>
              <AddressAutocomplete
                value={field.value ?? ''}
                onChange={field.onChange}
                disabled={!country}
                country={country}
                onSelectSuggestion={(details) => {
                  if (details.address) form.setValue('address', details.address);
                  if (details.zip_code) form.setValue('zip_code', details.zip_code);
                  if (details.city) form.setValue('city', details.city);
                  if (details.country) form.setValue('country', details.country);
                }}
              />
            </FieldContent>
            <FieldError />
          </FieldGroup>
        )}
      />

      {/* Code postal + Ville */}
      <div className="flex gap-3">
        <FieldRoot
          control={form.control}
          name="zip_code"
          render={({ field }) => (
            <FieldGroup className="w-32 shrink-0">
              <FieldLabel className="text-xs">Code postal</FieldLabel>
              <FieldContent>
                <Input
                  aria-label="Code postal"
                  className="text-xs"
                  maxLength={20}
                  {...field}
                  value={field.value ?? ''}
                />
              </FieldContent>
              <FieldError />
            </FieldGroup>
          )}
        />
        <FieldRoot
          control={form.control}
          name="city"
          render={({ field }) => (
            <FieldGroup className="flex-1">
              <FieldLabel className="text-xs">Ville</FieldLabel>
              <FieldContent>
                <Input
                  aria-label="Ville"
                  className="text-xs"
                  maxLength={100}
                  {...field}
                  value={field.value ?? ''}
                />
              </FieldContent>
              <FieldError />
            </FieldGroup>
          )}
        />
      </div>

      <Separator className="my-1" />

      {/* ── Profil ── */}
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Profil</p>

      {/* Biographie */}
      <FieldRoot
        control={form.control}
        name="biography"
        render={({ field }) => (
          <FieldGroup>
            <FieldLabel className="text-xs">Biographie</FieldLabel>
            <FieldContent>
              <Textarea
                aria-label="Biographie"
                className="text-xs resize-none"
                rows={3}
                maxLength={2000}
                placeholder="Quelques mots sur cet utilisateur…"
                {...field}
                value={field.value ?? ''}
              />
            </FieldContent>
            <FieldError />
          </FieldGroup>
        )}
      />

      {/* Fuseau horaire + Langue */}
      <div className="flex gap-3">
        <FieldRoot
          control={form.control}
          name="timezone"
          render={({ field }) => (
            <FieldGroup className="flex-1">
              <FieldLabel className="text-xs">Fuseau horaire</FieldLabel>
              <Select
                onValueChange={(v) => field.onChange(v === '__none__' ? null : v)}
                value={field.value ?? '__none__'}
              >
                <FieldContent>
                  <SelectTrigger
                    size="default"
                    aria-label="Fuseau horaire"
                    className="w-full text-xs"
                  >
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                </FieldContent>
                <SelectContent>
                  <SelectItem value="__none__">— Non renseigné</SelectItem>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError />
            </FieldGroup>
          )}
        />

        <FieldRoot
          control={form.control}
          name="preferred_language"
          render={({ field }) => (
            <FieldGroup className="w-36 shrink-0">
              <FieldLabel className="text-xs">Langue préférée</FieldLabel>
              <Select
                onValueChange={(v) => field.onChange(v === '__none__' ? null : v)}
                value={field.value ?? '__none__'}
              >
                <FieldContent>
                  <SelectTrigger
                    size="default"
                    aria-label="Langue préférée"
                    className="w-full text-xs"
                  >
                    <SelectValue placeholder="Langue" />
                  </SelectTrigger>
                </FieldContent>
                <SelectContent>
                  <SelectItem value="__none__">— Non renseigné</SelectItem>
                  {LANGUAGES.map((l) => (
                    <SelectItem key={l.code} value={l.code}>
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError />
            </FieldGroup>
          )}
        />
      </div>
    </>
  );
}

export type { ProfileFormValues };
