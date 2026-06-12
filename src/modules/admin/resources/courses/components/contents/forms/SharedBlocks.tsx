import type { ReactNode } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function MainBlock({
  title = "Principale",
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <h2 className="mb-4 text-base font-semibold text-foreground">{title}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export function SecondaryAccordions({
  appearance,
  withCommon = true,
  withTags = true,
  withModule = true,
}: {
  appearance?: ReactNode;
  withCommon?: boolean;
  withTags?: boolean;
  withModule?: boolean;
}) {
  return (
    <Accordion type="multiple" className="rounded-xl border border-border bg-card">
      {appearance && (
        <AccordionItem value="appearance" className="border-b last:border-b-0">
          <AccordionTrigger className="px-6">Apparence</AccordionTrigger>
          <AccordionContent className="px-6 pb-4">{appearance}</AccordionContent>
        </AccordionItem>
      )}
      {withCommon && (
        <AccordionItem value="common" className="border-b last:border-b-0">
          <AccordionTrigger className="px-6">Réglages courants</AccordionTrigger>
          <AccordionContent className="px-6 pb-4">
            <div className="space-y-3">
              <Field label="Disponibilité">
                <Input placeholder="Disponible" />
              </Field>
              <Field label="Numéro d'identification">
                <Input />
              </Field>
              <Field label="Imposer la langue">
                <Input placeholder="Aucune" />
              </Field>
            </div>
          </AccordionContent>
        </AccordionItem>
      )}
      {withTags && (
        <AccordionItem value="tags" className="border-b last:border-b-0">
          <AccordionTrigger className="px-6">Tags</AccordionTrigger>
          <AccordionContent className="px-6 pb-4">
            <Field label="Tags">
              <Input placeholder="Séparés par des virgules" />
            </Field>
          </AccordionContent>
        </AccordionItem>
      )}
      {withModule && (
        <AccordionItem value="module" className="border-b last:border-b-0">
          <AccordionTrigger className="px-6">Module</AccordionTrigger>
          <AccordionContent className="px-6 pb-4">
            <div className="space-y-3">
              <Field label="Compétences de cours">
                <Input placeholder="Aucune" />
              </Field>
              <Field label="Lors de l'achèvement de l'activité">
                <Input placeholder="Marquer comme terminé" />
              </Field>
            </div>
          </AccordionContent>
        </AccordionItem>
      )}
    </Accordion>
  );
}

export function AppearanceStandard() {
  return (
    <div className="space-y-3">
      <CheckboxRow id="show-desc" label="Afficher la description de la page" />
      <CheckboxRow id="show-modified" label="Afficher la date de dernière modification" />
    </div>
  );
}

export function CheckboxRow({ id, label }: { id: string; label: string }) {
  return (
    <label htmlFor={id} className="flex items-center gap-2 text-sm">
      <Checkbox id={id} />
      <span>{label}</span>
    </label>
  );
}

export function Field({
  label,
  required,
  children,
  hint,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}