"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Loader2 } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import TenantInfoStep from "./wizard/TenantInfoStep";
import AdminStep from "./wizard/AdminInfoStep";

const wizardSchema = z.object({
  name: z.string().min(1, "Le nom du tenant est requis"),
  subdomain: z
    .string()
    .min(1, "Le sous-domaine est requis")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Lettres minuscules, chiffres et tirets uniquement",
    ),
  logo: z.instanceof(File).nullable().optional(),
  color: z.string().min(1, "La couleur est requise"),
  firstName: z.string().min(1, "Le prénom est requis"),
  lastName: z.string().min(1, "Le nom est requis"),
  email: z
    .string()
    .min(1, "L'email est requis")
    .email("Veuillez entrer un email valide"),
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  confirmPassword: z.string().min(8, "La confirmation du mot de passe est requise"),
});

export type WizardFormData = z.infer<typeof wizardSchema>;

// Ensure password and confirmation match
wizardSchema.refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});



interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateTenantWizard({ open, onOpenChange }: Props) {
  const [step, setStep] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<WizardFormData>({
    resolver: zodResolver(wizardSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      subdomain: "",
      logo: null,
      color: "#2563eb",
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const {
    watch,
    trigger,
    reset,
    formState: { isValid },
  } = form;

  const color = watch("color");


  const handleClose = useCallback(() => {
    reset();
    setStep(0);
    setLogoPreview(null);
    setShowPassword(false);
    setLoading(false);
    onOpenChange(false);
  }, [reset, onOpenChange]);

  const handleNext = useCallback(async () => {
    const valid = await trigger(["name", "subdomain", "logo", "color"]);
    if (valid) setStep(1);
  }, [trigger]);

  const handlePrev = useCallback(() => {
    setStep(0);
  }, []);

  const onSubmit = useCallback(
    async (_data: WizardFormData) => {
      setLoading(true);
      await new Promise((r) => setTimeout(r, 1800));
      setLoading(false);
      handleClose();
    },
    [handleClose],
  );

  const handleLogoChange = useCallback(
    (
      e: React.ChangeEvent<HTMLInputElement>,
      onChange: (file: File | null) => void,
    ) => {
      const file = e.target.files?.[0] ?? null;
      onChange(file);
      if (file) {
        const reader = new FileReader();
        reader.onload = () => setLogoPreview(reader.result as string);
        reader.readAsDataURL(file);
      } else {
        setLogoPreview(null);
      }
    },
    [],
  );

  const hasStep1Error = !!(
    form.formState.errors.name ||
    form.formState.errors.subdomain ||
    form.formState.errors.color
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-xl rounded-2xl p-0 gap-0"
        showCloseButton={false}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="px-8 pt-6 pb-0 shrink-0">
          <div>
            <DialogTitle className="text-lg font-bold tracking-tight text-blue-500">
              CREER UN TENANT
            </DialogTitle>
            <DialogDescription className="mt-0.5 text-sm text-muted-foreground">
              {step === 0
                ? "Étape 1 sur 2 — Informations du tenant"
                : "Étape 2 sur 2 — Administrateur principal"}
            </DialogDescription>
          </div>

          <Separator className="mt-4" />
        </DialogHeader>

        <Form {...form}>
          <form className="flex-1 px-8 py-6">
            <div className="relative">
              <div
                className={cn(
                  "transition-all duration-300 ease-in-out",
                  step === 0
                    ? "opacity-100 translate-x-0"
                    : "opacity-0 -translate-x-6 absolute inset-x-0 pointer-events-none",
                )}
              >
                  <TenantInfoStep form={form} fileInputRef={fileInputRef} logoPreview={logoPreview} handleLogoChange={handleLogoChange} color={color} />
              </div>

              <div
                className={cn(
                  "transition-all duration-300 ease-in-out",
                  step === 1
                    ? "opacity-100 translate-x-0"
                    : "opacity-0 translate-x-6 absolute inset-x-0 pointer-events-none",
                )}
              >
                <AdminStep form={form} showPassword={showPassword} setShowPassword={setShowPassword} />
              </div>
            </div>
          </form>
        </Form>

        <Separator />

        <div className="px-8 py-5">
          <div className="flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              disabled={loading}
              size="lg"
            >
              Annuler
            </Button>

            <div className="flex items-center gap-3">
              {step === 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handlePrev}
                  disabled={loading}
                  size="lg"
                >
                  Précédent
                </Button>
              )}

              {step === 0 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={hasStep1Error}
                  size="lg"
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  Suivant
                  <ArrowRight className="size-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  disabled={!isValid || loading}
                  onClick={form.handleSubmit(onSubmit)}
                  size="lg"
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  {loading ? <Loader2 className="size-4 animate-spin" /> : null}
                  Créer
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
