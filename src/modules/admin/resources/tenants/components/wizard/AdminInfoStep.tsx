"use client";

import React from "react";
import { Eye, EyeOff } from "lucide-react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { UseFormReturn } from "react-hook-form";
import type { WizardFormData } from "../CreateTenantWizard";

interface Props {
  form: UseFormReturn<WizardFormData>;
  showPassword: boolean;
  setShowPassword: (s: boolean) => void;
}

export const AdminInfoStep = React.memo(function AdminInfoStep({ form, showPassword, setShowPassword }: Props) {
  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="firstName"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs">Prénom</FormLabel>
            <FormControl>
              <Input placeholder="Jean" className="h-10 px-3 text-sm" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="lastName"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs">Nom</FormLabel>
            <FormControl>
              <Input placeholder="Dupont" className="h-10 px-3 text-sm" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="email"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs">Email</FormLabel>
            <FormControl>
              <Input type="email" placeholder="jean.dupont@exemple.com" className="h-10 px-3 text-sm" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="password"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs">Mot de passe</FormLabel>
            <FormControl>
              <div className="relative">
                <Input type={showPassword ? "text" : "password"} placeholder="Minimum 8 caractères" className="h-10 px-3 pr-11 text-sm" {...field} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" tabIndex={-1}>
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="confirmPassword"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs">Confirmer le mot de passe</FormLabel>
            <FormControl>
              <div className="relative">
                <Input type={showPassword ? "text" : "password"} placeholder="Confirmez le mot de passe" className="h-10 px-3 pr-11 text-sm" {...field} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" tabIndex={-1}>
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
});

export default AdminInfoStep;
