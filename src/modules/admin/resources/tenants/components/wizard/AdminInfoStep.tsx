"use client";

import { Eye, EyeOff } from "lucide-react";
import React from "react";
import type { UseFormReturn } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { WizardFormData } from "../CreateTenantWizard";

interface Props {
  form: UseFormReturn<WizardFormData>;
  showPassword: boolean;
  setShowPassword: (s: boolean) => void;
}

export const AdminInfoStep = React.memo(function AdminInfoStep({
  form,
  showPassword,
  setShowPassword,
}: Props) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="first_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Prénom</FormLabel>
              <FormControl>
                <Input
                  placeholder="Jean"
                  className="h-10 px-3 text-sm"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="last_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Nom</FormLabel>
              <FormControl>
                <Input
                  placeholder="Dupont"
                  className="h-10 px-3 text-sm"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="username"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs">Nom d'utilisateur</FormLabel>
            <FormControl>
              <Input
                placeholder="jean.dupont"
                className="h-10 px-3 text-sm"
                {...field}
              />
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
              <Input
                type="email"
                placeholder="jean.dupont@exemple.com"
                className="h-10 px-3 text-sm"
                {...field}
              />
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
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Minimum 8 caractères"
                  className="h-10 px-3 pr-11 text-sm"
                  {...field}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="city"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Ville</FormLabel>
              <FormControl>
                <Input
                  placeholder="Paris"
                  className="h-10 px-3 text-sm"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="country"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Pays</FormLabel>
              <FormControl>
                <Input
                  placeholder="France"
                  className="h-10 px-3 text-sm"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
});

export default AdminInfoStep;
