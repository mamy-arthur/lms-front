"use client";

import { Save } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import ProgramFlow from "./ProgramFlow";
import { ProgramFormPanel, type ProgramFormValues } from "./ProgramFormPanel";

// ─── Default form values ──────────────────────────────────────────────────────

const DEFAULT_FORM_VALUES: ProgramFormValues = {
  name: "",
  description: "",
  visible: false,
  deadline: undefined,
  category: "",
  image: null,
  publishedAt: undefined,
  author: "",
  cost: "",
  currency: "EUR",
};

// ─── Component ────────────────────────────────────────────────────────────────

type ProgramDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ProgramDrawer({ open, onOpenChange }: ProgramDrawerProps) {
  const [formValues, setFormValues] =
    useState<ProgramFormValues>(DEFAULT_FORM_VALUES);

  const handleSave = () => {
    // TODO: submit formValues + ProgramFlow data
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {/* Full-width sheet — nearly full viewport */}
      <SheetContent side="right" className="flex w-screen! max-w-screen! flex-col p-0">
        {/* ── Header ── */}
        <SheetHeader className="shrink-0 border-b px-5 py-3.5">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="text-base">Nouvelle formation</SheetTitle>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Définissez les informations et construisez le parcours
                pédagogique.
              </p>
            </div>
            <div className="flex items-center gap-2 pr-6">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
              >
                Annuler
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                className="bg-(--color-primary) hover:bg-(--color-primary)/80 text-primary-foreground"
              >
                <Save className="size-3.5" />
                Sauvegarder
              </Button>
            </div>
          </div>
        </SheetHeader>

        {/* ── Body: 70 / 30 split ── */}
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <div className="flex-6 overflow-hidden">
            <ProgramFlow />
          </div>
          <div className="flex-4 overflow-hidden">
            <ProgramFormPanel values={formValues} onChange={setFormValues} />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
