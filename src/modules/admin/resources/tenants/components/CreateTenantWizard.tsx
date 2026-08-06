'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Save } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import TenantInfoStep from './wizard/TenantInfoStep';
import {
  CreateEditorUserStep,
  type CreateEditorUserStepHandle,
} from './wizard/CreateEditorUserStep';
import { useCreateTenant } from '../hooks/useTenantsQuery';

const wizardSchema = z.object({
  name: z.string().min(1, 'Le nom du tenant est requis'),
  subdomain: z
    .string()
    .min(1, 'Le sous-domaine est requis')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Lettres minuscules, chiffres et tirets uniquement'),
  logo: z.instanceof(File).nullable().optional(),
  color: z.string().min(1, 'La couleur est requise'),
});

export type WizardFormData = z.infer<typeof wizardSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateTenantWizard({ open, onOpenChange }: Props) {
  const [step, setStep] = useState(0);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [createdTenant, setCreatedTenant] = useState<{
    tenant_id: string;
    tenant_name: string;
    editor_id: string | null;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorStepRef = useRef<CreateEditorUserStepHandle | null>(null);
  const { mutateAsync, isPending: loadingTenant } = useCreateTenant();

  const form = useForm<WizardFormData>({
    resolver: zodResolver(wizardSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      subdomain: '',
      logo: null,
      color: '#2563eb',
    },
  });

  const { watch, trigger, reset } = form;

  const color = watch('color');

  const handleClose = useCallback(() => {
    reset();
    setStep(0);
    setLogoPreview(null);
    setLoading(false);
    setCreatedTenant(null);
    onOpenChange(false);
  }, [reset, onOpenChange]);

  const handleNext = useCallback(async () => {
    const valid = await trigger(['name', 'subdomain', 'logo', 'color']);

    if (valid) {
      try {
        const result = await mutateAsync({
          editor_name: form.getValues('name'),
          client_name: form.getValues('name'),
          tenant_name: form.getValues('name'),
          subdomain: form.getValues('subdomain'),
          primary_color: form.getValues('color'),
        });
        setCreatedTenant({
          tenant_id: result.data.id,
          tenant_name: result.data.name,
          editor_id: result.data.editor_id ?? null,
        });
        setStep(1);
      } catch {
        // l'erreur réseau est déjà gérée par React Query
      }
    }
  }, [trigger, form, mutateAsync]);

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
        className="flex w-full flex-col gap-0 p-0 overflow-hidden sm:max-w-150! lg:max-w-200!"
        showCloseButton={true}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <SheetHeader className="border-b px-4 py-4">
          <SheetTitle>{step === 0 ? 'Créer un tenant' : 'Ajouter un éditeur'}</SheetTitle>
          <SheetDescription>
            {step === 0
              ? 'Renseignez les informations du tenant.'
              : 'Le tenant a été créé. Vous pouvez maintenant lui associer un éditeur.'}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form className="flex flex-1 flex-col min-h-0">
            <div className="flex-1 overflow-y-auto px-6 py-4">
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
                  {createdTenant && (
                    <CreateEditorUserStep
                      ref={editorStepRef}
                      tenantId={createdTenant.tenant_id}
                      tenantName={createdTenant.tenant_name}
                      editorId={createdTenant.editor_id}
                      onSuccess={handleClose}
                      onLoadingChange={setLoading}
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 border-t bg-background px-6 py-4 shrink-0">
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
                    disabled={loading}
                    onClick={() => editorStepRef.current?.triggerSubmit()}
                    size="lg"
                    className="text-white bg-(--color-primary) hover:bg-(--color-primary) hover:text-white"
                  >
                    {loading ? <Loader2 className="size-4 animate-spin" /> : null}
                    Créer l'éditeur
                  </Button>
                )}
              </div>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
