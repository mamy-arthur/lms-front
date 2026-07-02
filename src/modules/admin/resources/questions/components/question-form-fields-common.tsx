"use client";

import type { UseFormReturn } from "react-hook-form";
import { useWatch } from "react-hook-form";
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
import type { FormValues } from "./question-form-data";

interface CommonFieldsProps {
  form: UseFormReturn<FormValues>;
}

export function QuestionFormFieldsCommon({ form }: CommonFieldsProps) {
  const hasDuration = useWatch({ control: form.control, name: "hasDuration" });

  return (
    <div className="flex h-full min-h-0 flex-col rounded-3xl bg-background/90 ring-1 ring-border/10">
        <div className="mb-3">
          <p className="text-xs font-semibold uppercase text-muted-foreground">
            Informations générales
          </p>
          <p className="mt-2 text-xs text-foreground/80">
            Renseignez les métadonnées et les paramètres de base de la question
          </p>
        </div>
      <div className="flex h-full min-h-0 flex-col overflow-hidden">
        <section className="rounded-3xl bg-muted/5 ring-1 ring-border/10">
          <FieldRoot
            control={form.control}
            name="name"
            render={({ field }) => (
              <FieldGroup className="space-y-2 pl-3 py-2">
                <FieldLabel className="text-xs">Nom*</FieldLabel>
                <FieldContent>
                  <Input autoFocus aria-label="Nom" {...field} className="text-foreground/70"/>
                </FieldContent>
                <FieldError />
              </FieldGroup>
            )}
          />

          <FieldRoot
            control={form.control}
            name="text"
            render={({ field }) => (
              <FieldGroup className="space-y-2 pl-3 py-2">
                <FieldLabel className="text-xs">Texte de la question *</FieldLabel>
                <FieldContent>
                  <Textarea
                    aria-label="Texte"
                    className="min-h-20 resize-y text-foreground/80"

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
              <FieldGroup className="space-y-2 pl-3 py-2">
                <FieldLabel className="text-xs">Commentaire général</FieldLabel>
                <FieldContent>
                  <Textarea
                    aria-label="Commentaire général"
                    className="min-h-20 resize-y text-foreground/70"
                    {...field}
                  />
                </FieldContent>
                <FieldError />
              </FieldGroup>
            )}
          />
        </section>

        <section className="rounded-3xl bg-muted/5 pl-3 py-5 ring-1 ring-border/10">
            <p className="text-xs font-semibold uppercase text-muted-foreground pt-5">
             Paramètres
            </p>
            <p className="mt-2 text-xs text-foreground/80">
              Activez la question, ajoutez une durée et associez-la à un module
            </p>
        <FieldRoot
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FieldGroup>
              <div className="flex items-center justify-between rounded-3xl bg-muted/20 p-3">
                <div>
                  <FieldLabel className="text-xs font-medium">Actif</FieldLabel>
                  <p className="text-[11px] text-muted-foreground">
                    Activer cette question dans le quiz.
                  </p>
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

        <FieldRoot
          control={form.control}
          name="hasDuration"
          render={({ field }) => (
            <FieldGroup>
              <div className="flex items-center justify-between rounded-3xl bg-muted/20 p-3">
                <div>
                  <FieldLabel className="text-xs font-medium">Durée</FieldLabel>
                  <p className="text-[11px] text-muted-foreground">
                    Activer la durée et définir le format.
                  </p>
                </div>
                <Switch
                  checked={field.value}
                  onCheckedChange={(v) => {
                    field.onChange(v);
                    if (!v) {
                      form.setValue("durationValue", "");
                      form.setValue("durationUnit", "minute");
                    }
                  }}
                  className="data-[state=checked]:bg-(--color-primary)"
                />
              </div>
              <FieldError />
            </FieldGroup>
          )}
        />

        {hasDuration && (
            <div className="flex gap-3 items-start border-l-2 border-muted/40 pl-3">
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
                    <FieldGroup className="w-[140px] shrink-0 space-y-2">
                      <FieldLabel className="text-xs">Unité</FieldLabel>
                      <FieldContent>
                        <Select onValueChange={field.onChange} value={field.value}>
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
            name="referenceNumber"
            render={({ field }) => (
              <FieldGroup className="space-y-2 pl-3 py-3">
                <FieldLabel className="text-xs">Numéro de référence</FieldLabel>
                <FieldContent>
                  <Input aria-label="Numéro de référence" {...field} className="text-foreground/70"/>
                </FieldContent>
                <FieldError />
              </FieldGroup>
            )}
          />

        <FieldRoot
          control={form.control}
          name="moduleId"
          render={({ field }) => (
            <FieldGroup className="space-y-2 pl-3 py-3">
              <FieldLabel className="text-xs">Module</FieldLabel>
              <FieldContent>
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="w-full text-foreground/70" aria-label="Module">
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
      </section>
    </div>
    </div>
  );
}
