'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Save } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import AdminStep from './wizard/AdminInfoStep';
import TenantInfoStep from './wizard/TenantInfoStep';
import { useCreateTenant } from '../hooks/useTenantsQuery';

const wizardSchema = z.object({
  name: z.string().min(1, 'Le nom du tenant est requis'),
  subdomain: z
    .string()
    .min(1, 'Le sous-domaine est requis')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Lettres minuscules, chiffres et tirets uniquement'),
  logo: z.instanceof(File).nullable().optional(),
  color: z.string().min(1, 'La couleur est requise'),
  first_name: z.string().min(1, 'Le prénom est requis'),
  last_name: z.string().min(1, 'Le nom est requis'),
  username: z.string().max(120).optional().or(z.literal('')),
  email: z.string().min(1, "L'email est requis").email('Veuillez entrer un email valide'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
  city: z.string().max(120).optional().or(z.literal('')),
  country: z.string().max(120).optional().or(z.literal('')),
});

export type WizardFormData = z.infer<typeof wizardSchema>;

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
  const { mutateAsync, isPending: loadingTenant } = useCreateTenant();

  const form = useForm<WizardFormData>({
    resolver: zodResolver(wizardSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      subdomain: '',
      logo: null,
      color: '#2563eb',
      first_name: '',
      last_name: '',
      username: '',
      email: '',
      password: '',
      city: '',
      country: '',
    },
  });

  const {
    watch,
    trigger,
    reset,
    formState: { isValid },
  } = form;

  const color = watch('color');

  const handleClose = useCallback(() => {
    reset();
    setStep(0);
    setLogoPreview(null);
    setShowPassword(false);
    setLoading(false);
    onOpenChange(false);
  }, [reset, onOpenChange]);

  const handleNext = useCallback(async () => {
    const valid = await trigger(['name', 'subdomain', 'logo', 'color']);

    if (valid) {
      await mutateAsync({
        editor_name: form.getValues('name'),
        client_name: form.getValues('name'),
        tenant_name: form.getValues('name'),
        subdomain: form.getValues('subdomain'),
        primary_color: form.getValues('color'),
      });
      setStep(1);
    }
  }, [trigger]);

  const onSubmit = useCallback(
    async () => {
      setLoading(true);
      await new Promise((r) => setTimeout(r, 1800));
      setLoading(false);
      handleClose();
    },
    [handleClose],
  );

  const handleLogoChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, onChange: (file: File | null) => void) => {
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
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent
        className="flex w-full flex-col gap-0 p-0 sm:max-w-xl"
        showCloseButton={true}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <SheetHeader className="px-6 pt-6 pb-0 shrink-0">
          <div>
            <SheetTitle className="text-lg tracking-tight">
              {step === 0 ? 'Créer un tenant' : 'Ajouter un éditeur'}
            </SheetTitle>
            <SheetDescription className="mt-0.5 text-xs text-muted-foreground">
              {step === 0
                ? 'Renseignez les informations du tenant.'
                : 'Le tenant a été créé. Vous pouvez maintenant lui associer un éditeur (optionnel).'}
            </SheetDescription>
          </div>

          <Separator className="mt-4" />
        </SheetHeader>

        <Form {...form}>
          <form className="flex-1 px-6 py-6">
            <div className="relative">
              <div
                className={cn(
                  'transition-all duration-300 ease-in-out',
                  step === 0
                    ? 'opacity-100 translate-x-0'
                    : 'opacity-0 -translate-x-6 absolute inset-x-0 pointer-events-none',
                )}
              >
                <TenantInfoStep
                  form={form}
                  fileInputRef={fileInputRef}
                  logoPreview={logoPreview}
                  handleLogoChange={handleLogoChange}
                  color={color}
                />
              </div>

              <div
                className={cn(
                  'transition-all duration-300 ease-in-out',
                  step === 1
                    ? 'opacity-100 translate-x-0'
                    : 'opacity-0 translate-x-6 absolute inset-x-0 pointer-events-none',
                )}
              >
                <AdminStep
                  form={form}
                  showPassword={showPassword}
                  setShowPassword={setShowPassword}
                />
              </div>
            </div>
          </form>
        </Form>

        <Separator />

        <div className="px-8 py-5">
          <div className="flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              size="lg"
            >
              Annuler
            </Button>

            <div className="flex items-center gap-3">
              {step === 0 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={hasStep1Error || loadingTenant}
                  variant="outline"
                  size="lg"
                  className="text-white bg-(--color-primary) hover:bg-(--color-primary) hover:text-white"
                >
                  {loadingTenant ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <>
                      <Save className="size-4" />
                      Créer le tenant
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  type="button"
                  disabled={!isValid || loading}
                  onClick={form.handleSubmit(onSubmit)}
                  size="lg"
                  className="text-white bg-(--color-primary) hover:bg-(--color-primary) hover:text-white"
                >
                  {loading ? <Loader2 className="size-4 animate-spin" /> : null}
                  Créer l'éditeur
                </Button>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
