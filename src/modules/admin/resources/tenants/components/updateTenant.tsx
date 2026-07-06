'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Save } from 'lucide-react';
import { useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useUpdateTenant } from '../hooks/useTenantsQuery';
import { Input } from '@/components/ui/input';
import { Tenant } from '@/shared/types/tenants/tenant';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const updateSchema = z.object({
  name: z.string().min(1, 'Le nom du tenant est requis'),
  status: z.string(),
});

export type UpdateTenantFormData = z.infer<typeof updateSchema>;

interface Props {
  tenant?: Tenant;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UpdateTenantWizard({ open, onOpenChange, tenant }: Props) {
  const { mutateAsync, isPending: loadingTenant } = useUpdateTenant();

  const form = useForm<UpdateTenantFormData>({
    resolver: zodResolver(updateSchema),
    mode: 'onChange',
    defaultValues: {
      name: tenant?.name,
      status: tenant?.status ?? 'active',
    },
  });

  const { reset } = form;

  const handleClose = useCallback(() => {
    reset();
    onOpenChange(false);
  }, [reset, onOpenChange]);
  const onSubmit = async (data: UpdateTenantFormData) => {
    if (!tenant) return;

    await mutateAsync({
      id: String(tenant.id),
      payload: {
        name: data.name,
        status: data.status,
      },
    });

    handleClose();
  };

  useEffect(() => {
    if (!tenant) return;

    form.reset({
      name: tenant.name,
      status: tenant.status,
    });
  }, [tenant, form]);

  const hasStep1Error = !!form.formState.errors.name;

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent
        className="flex w-full flex-col gap-0 p-0 sm:max-w-xl"
        showCloseButton={true}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <SheetHeader className="px-4 pt-6 pb-0 shrink-0">
          <div>
            <SheetTitle className="text-lg tracking-tight">Modifier le tenant</SheetTitle>
            <SheetDescription className="mt-0.5 text-xs text-muted-foreground">
              Modifier l'information du tenant.
            </SheetDescription>
          </div>

          <Separator className="mt-4" />
        </SheetHeader>
        <Form {...form}>
          <form className="flex-1 px-4 py-6">
            <div className="relative">
              <div className={cn('transition-all duration-300 ease-in-out space-y-5')}>
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
                  name="status"
                  render={({ field }) => (
                    <FormItem className="w-full flex-1">
                      <FormLabel className="text-xs">Statut</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue defaultValue={tenant?.status} className="w-full" />
                          </SelectTrigger>
                        </FormControl>

                        <SelectContent>
                          <SelectItem value="active">
                            <div className="flex items-center gap-2">
                              <div className="size-2 rounded-full bg-emerald-500" />
                              Actif
                            </div>
                          </SelectItem>

                          <SelectItem value="inactive">
                            <div className="flex items-center gap-2">
                              <div className="size-2 rounded-full bg-slate-400" />
                              Inactif
                            </div>
                          </SelectItem>

                          <SelectItem value="suspended">
                            <div className="flex items-center gap-2">
                              <div className="size-2 rounded-full bg-red-500" />
                              Suspendu
                            </div>
                          </SelectItem>

                          <SelectItem value="pending">
                            <div className="flex items-center gap-2">
                              <div className="size-2 rounded-full bg-amber-500" />
                              En attente
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </form>
          <Separator />

          <div className="px-8 py-5">
            <div className="flex items-center justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={loadingTenant}
                size="lg"
              >
                Annuler
              </Button>

              <div className="flex items-center gap-3">
                <Button
                  type="submit"
                  disabled={hasStep1Error || loadingTenant}
                  variant="outline"
                  size="lg"
                  className="text-white bg-(--color-primary) hover:bg-(--color-primary) hover:text-white"
                  onClick={form.handleSubmit(onSubmit)}
                >
                  {loadingTenant ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <>
                      <Save className="size-4" />
                      Modifer le tenant
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
