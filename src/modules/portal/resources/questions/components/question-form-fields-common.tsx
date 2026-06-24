"use client";

import React from "react";
import { type UseFormReturn, useWatch } from "react-hook-form";
import {
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldRoot,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { MOCK_ADMIN_MODULES } from "@/modules/shared/components/modules/mocks/modules-admin.mock";
import { DURATION_UNIT_OPTIONS } from "@/modules/shared/components/questions";
interface CommonFieldsProps {
  form: UseFormReturn<any>;
}

export const QuestionFormFieldsCommon = React.memo(
  function QuestionFormFieldsCommon({ form }: CommonFieldsProps) {
    const hasDuration = useWatch({ control: form.control, name: "hasDuration" });

    return (
      <div className="rounded-lg border p-4">
        <div className="space-y-3">
          <FieldRoot
            control={form.control}
            name="name"
            render={({ field }) => (
              <FieldGroup className="space-y-2">
                <FieldLabel className="text-xs">Nom*</FieldLabel>
                <FieldContent>
                  <Input autoFocus aria-label="Nom" {...field} />
                </FieldContent>
                <FieldError />
              </FieldGroup>
            )}
          />

          <FieldRoot
            control={form.control}
            name="text"
            render={({ field }) => (
              <FieldGroup className="space-y-2">
                <FieldLabel className="text-xs">
                  Texte de la question *
                </FieldLabel>
                <FieldContent>
                  <Textarea
                    aria-label="Texte"
                    className="min-h-16 resize-y"
                    {...field}
                  />
                </FieldContent>
                <FieldError />
              </FieldGroup>
            )}
          />

          <FieldRoot
            control={form.control}
            name="generalFeedback"
            render={({ field }) => (
              <FieldGroup className="space-y-2">
                <FieldLabel className="text-xs">Feedback général</FieldLabel>
                <FieldContent>
                  <Textarea
                    aria-label="Feedback général"
                    className="min-h-16 resize-y"
                    {...field}
                  />
                </FieldContent>
                <FieldError />
              </FieldGroup>
            )}
          />

          <FieldRoot
            control={form.control}
            name="identificationNumber"
            render={({ field }) => (
              <FieldGroup className="space-y-2">
                <FieldLabel className="text-xs">
                  Numéro d'identification
                </FieldLabel>
                <FieldContent>
                  <Input aria-label="Numéro d'identification" {...field} />
                </FieldContent>
                <FieldError />
              </FieldGroup>
            )}
          />

          <FieldRoot
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FieldGroup>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FieldLabel className="text-xs">Actif</FieldLabel>
                  </div>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="data-[state=checked]:bg-(--color-primary)"
                  />
                </div>
                <FieldError />
              </FieldGroup>
            )}
          />

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <span className="text-xs font-medium text-foreground select-none">
                Durée
              </span>
            </div>
            <Switch
              checked={hasDuration}
              onCheckedChange={(v) => {
                form.setValue("hasDuration", v);
                if (!v) {
                  form.setValue("durationValue", "");
                  form.setValue("durationUnit", "minute");
                }
              }}
              className="data-[state=checked]:bg-(--color-primary)"
            />
          </div>
          {hasDuration && (
            <div className="flex gap-2">
              <FieldRoot
                control={form.control}
                name="durationValue"
                render={({ field }) => (
                  <FieldGroup className="flex-1 space-y-2">
                    <FieldLabel className="text-xs">Valeur</FieldLabel>
                    <FieldContent>
                      <Input
                        type="number"
                        min={1}
                        aria-label="Valeur"
                        {...field}
                      />
                    </FieldContent>
                    <FieldError />
                  </FieldGroup>
                )}
              />
              <FieldRoot
                control={form.control}
                name="durationUnit"
                render={({ field }) => (
                  <FieldGroup className="w-32 space-y-2">
                    <FieldLabel className="text-xs">Unité</FieldLabel>
                    <FieldContent>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger aria-label="Unité">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DURATION_UNIT_OPTIONS.map((u) => (
                            <SelectItem key={u.value} value={u.value}>
                              {u.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FieldContent>
                    <FieldError />
                  </FieldGroup>
                )}
              />
            </div>
          )}

          <FieldRoot
            control={form.control}
            name="moduleId"
            render={({ field }) => (
              <FieldGroup className="space-y-2">
                <FieldLabel className="text-xs">Module</FieldLabel>
                <FieldContent>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger aria-label="Module">
                      <SelectValue placeholder="Sélectionner un module" />
                    </SelectTrigger>
                    <SelectContent>
                      {MOCK_ADMIN_MODULES.map((mod) => (
                        <SelectItem key={String(mod.id)} value={String(mod.id)}>
                          {String(mod.name)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldContent>
                <FieldError />
              </FieldGroup>
            )}
          />
        </div>
      </div>
    );
  },
);
