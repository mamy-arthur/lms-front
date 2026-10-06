'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTenants } from '@/modules/admin/resources/tenants/hooks/useTenantsQuery';
import {
  useGlobalTwoFactorSettings,
  useTenantTemplateMails,
  useTenantTwoFactorSettings,
  useUpdateGlobalTwoFactorSettings,
  useUpdateTenantTwoFactorSettings,
} from '../hooks/useTwoFactorSettings';
import type { TwoFactorSettings } from '../types';
import { TwoFactorSettingsForm } from './_components/two-factor-settings-form';

export function TwoFactorSettingsPage() {
  const [tenantId, setTenantId] = React.useState<string | null>(null);

  const globalSettings = useGlobalTwoFactorSettings();
  const updateGlobal = useUpdateGlobalTwoFactorSettings();

  const tenantSettings = useTenantTwoFactorSettings(tenantId);
  const updateTenant = useUpdateTenantTwoFactorSettings(tenantId);
  const templateMails = useTenantTemplateMails(tenantId);

  const tenants = useTenants();

  return (
    <div className="mx-auto w-full max-w-6xl bg-background">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Vérification en deux étapes</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Réglez l’envoi des codes de connexion pour l’ensemble de la plateforme ou pour un tenant
          en particulier.
        </p>
      </header>

      <Tabs defaultValue="global" className="w-full min-w-0">
        <TabsList>
          <TabsTrigger value="global">Global</TabsTrigger>
          <TabsTrigger value="tenant">Par tenant</TabsTrigger>
        </TabsList>

        <TabsContent value="global" className="mt-6">
          {globalSettings.isError ? (
            <SettingsError onRetry={() => globalSettings.refetch()} />
          ) : globalSettings.isLoading || !globalSettings.data ? (
            <SettingsSkeleton />
          ) : (
            <TwoFactorSettingsForm
              // Resynchronise les champs sur un enregistrement, jamais sur une
              // simple nouvelle référence de la réponse.
              key={resyncKey(globalSettings.data.data)}
              settings={globalSettings.data.data}
              scope="global"
              isSaving={updateGlobal.isPending}
              onSubmit={(payload) => updateGlobal.mutate(payload)}
            />
          )}
        </TabsContent>

        <TabsContent value="tenant" className="mt-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="tenant-selector">Tenant</Label>

            <Select value={tenantId ?? undefined} onValueChange={setTenantId}>
              <SelectTrigger id="tenant-selector" className="w-full sm:w-96">
                <SelectValue placeholder="Choisir un tenant" />
              </SelectTrigger>
              <SelectContent>
                {(tenants.data?.data ?? []).map((tenant) => (
                  // Tenant.id est typé number côté front alors que l'API renvoie un UUID.
                  <SelectItem key={tenant.id} value={String(tenant.id)}>
                    {tenant.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {tenantId === null ? (
            <p className="text-sm text-muted-foreground">
              Sélectionnez un tenant pour afficher ses paramètres.
            </p>
          ) : tenantSettings.isError ? (
            <SettingsError onRetry={() => tenantSettings.refetch()} />
          ) : tenantSettings.isLoading || !tenantSettings.data ? (
            <SettingsSkeleton />
          ) : (
            <TwoFactorSettingsForm
              // Force la réinitialisation du formulaire au changement de tenant
              // et après un enregistrement, pas à chaque refetch.
              key={resyncKey(tenantSettings.data.data)}
              settings={tenantSettings.data.data}
              scope="tenant"
              inheritedValues={globalSettings.data?.data.effective}
              templateMails={templateMails.data?.data ?? []}
              templatesLoading={templateMails.isLoading}
              templatesError={templateMails.isError}
              onRetryTemplates={() => templateMails.refetch()}
              isSaving={updateTenant.isPending}
              onSubmit={(payload) => updateTenant.mutate(payload)}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-20 w-full" />
      {Array.from({ length: 6 }, (_, index) => (
        <Skeleton key={index} className="h-12 w-full" />
      ))}
    </div>
  );
}

function SettingsError({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4"
    >
      <p className="text-sm text-destructive">
        Impossible de charger les paramètres. Vérifiez vos droits d’accès ou réessayez.
      </p>

      <Button type="button" variant="outline" size="sm" onClick={onRetry}>
        Réessayer
      </Button>
    </div>
  );
}

/** Seule une écriture côté serveur doit écraser une saisie en cours. */
function resyncKey(settings: TwoFactorSettings): string {
  return `${settings.tenant_id ?? 'global'}:${settings.updated_at ?? ''}`;
}
