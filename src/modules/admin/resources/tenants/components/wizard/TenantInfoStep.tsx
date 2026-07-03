'use client';

import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

import type { UseFormReturn } from 'react-hook-form';
import type { WizardFormData } from '../CreateTenantWizard';

interface Props {
  form: UseFormReturn<WizardFormData>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  logoPreview: string | null;
  handleLogoChange: (
    e: React.ChangeEvent<HTMLInputElement>,
    onChange: (file: File | null) => void,
  ) => void;
  color: string;
}

const pastelColors = [
  '#6366F1', // Indigo
  '#8B5CF6', // Violet
  '#EC4899', // Rose
  '#F97316', // Orange
  '#EAB308', // Jaune
  '#22C55E', // Vert
  '#0EA5E9', // Bleu
  '#A16207', // Marron doré
];

export const TenantInfoStep = React.memo(function TenantInfoStep({
  form,
  fileInputRef,
  logoPreview,
  handleLogoChange,
  color,
}: Props) {
  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs">Nom du tenant</FormLabel>
            <FormControl>
              <Input placeholder="Ex: Académie Pro" className="text-xs" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="subdomain"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs">Sous-domaine</FormLabel>
            <FormControl>
              <div className="relative">
                <Input placeholder="mon-tenant" className="text-xs" {...field} />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground select-none pointer-events-none">
                  .learno.app
                </span>
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="logo"
        render={({ field: { value, onChange, ...field } }) => (
          <FormItem>
            <FormLabel className="text-xs">Logo</FormLabel>
            <FormControl>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleLogoChange(e, onChange)}
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    'flex cursor-pointer items-center gap-3 rounded-xl border border-dashed p-4 transition-colors text-xs',
                    'hover:border-primary/40 hover:bg-muted/20',
                    logoPreview ? 'border-primary/20' : 'border-muted-foreground/15',
                  )}
                >
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="h-10 w-10 shrink-0 rounded-lg object-contain ring-1 ring-border"
                    />
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <Upload className="size-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 text-left">
                    <p className="text-xs font-medium text-foreground">
                      {logoPreview ? 'Changer le logo' : 'Télécharger un logo'}
                    </p>
                    <p className="mt-px text-xs text-muted-foreground">PNG, JPG ou SVG</p>
                  </div>
                </div>
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="color"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs">Couleur principale</FormLabel>

            <FormControl>
              <div className="space-y-3 mt-4">
                <div className="flex flex-wrap gap-2">
                  {pastelColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => field.onChange(color)}
                      className={`h-8 w-8 rounded-full border-2 transition-all ${
                        field.value === color ? 'border-foreground scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>

                <div
                  className="h-10 rounded-lg border border-input px-3 text-xs flex items-center"
                  style={{
                    backgroundColor: field.value,
                  }}
                >
                  {field.value}
                </div>
              </div>
            </FormControl>

            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
});

export default TenantInfoStep;
