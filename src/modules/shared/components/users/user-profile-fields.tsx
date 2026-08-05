'use client';

import { useWatch, type UseFormReturn, type FieldValues } from 'react-hook-form';
import { FieldContent, FieldError, FieldGroup, FieldLabel, FieldRoot } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { COUNTRIES } from '@/shared/constants/countries';
import { LANGUAGES } from '@/shared/constants/languages';
import { TIMEZONES } from '@/shared/constants/timezones';
import { AddressAutocomplete } from './address-autocomplete';

// Generic T ensures callers pass a typed form; f casts to FieldValues for internal field access
export function UserProfileFields<T extends FieldValues>({ form }: { form: UseFormReturn<T> }) {
  const f = form as unknown as UseFormReturn<FieldValues>;
  const country = useWatch({ control: f.control, name: 'country' }) as string | null | undefined;

  return (
    <>
      <Separator className="my-1" />

      {/* ── Adresse ── */}
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Adresse
      </p>

      {/* Pays — obligatoire en premier pour activer l'autocomplétion */}
      <FieldRoot
        control={f.control}
        name="country"
        render={({ field }) => (
          <FieldGroup>
            <FieldLabel className="text-xs">Pays</FieldLabel>
            <Select
              onValueChange={(v) => {
                field.onChange(v === '__none__' ? null : v);
                // Réinitialise l'adresse si le pays change
                f.setValue('address', '');
                f.setValue('zip_code', '');
                f.setValue('city', '');
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

      {/* Adresse — autocomplétion LocationIQ activée si pays renseigné */}
      <FieldRoot
        control={f.control}
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
                  if (details.address) f.setValue('address', details.address);
                  if (details.zip_code) f.setValue('zip_code', details.zip_code);
                  if (details.city) f.setValue('city', details.city);
                  if (details.country) f.setValue('country', details.country);
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
          control={f.control}
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
          control={f.control}
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

      {/* Fuseau horaire + Langue */}
      <div className="flex gap-3">
        <FieldRoot
          control={f.control}
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
          control={f.control}
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
