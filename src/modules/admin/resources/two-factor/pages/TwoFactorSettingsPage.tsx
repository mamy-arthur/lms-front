'use client';

import * as React from 'react';

import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTenants } from '@/modules/admin/resources/tenants/hooks/useTenantsQuery';

import { TwoFactorSettingsForm } from './_components/two-factor-settings-form';
import {
  useGlobalTwoFactorSettings,
  useTenantTemplateMails,
  useTenantTwoFactorSettings,
  useUpdateGlobalTwoFactorSettings,
  useUpdateTenantTwoFactorSettings,
} from '../hooks/useTwoFactorSettings';

export function TwoFactorSettingsPage() {
  const [tenantId, setTenantId] = React.useState<string | null>(null);

  const globalSettings = useGlobalTwoFactorSettings();
  const updateGlobal = useUpdateGlobalTwoFactorSettings();

  const tenantSettings = useTenantTwoFactorSettings(tenantId);
  const updateTenant = useUpdateTenantTwoFactorSettings(tenantId);
  const templateMails = useTenantTemplateMails(tenantId);

  const tenants = useTenants();

  return (
    <div className="bg-background">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Vérification en deux étapes</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Réglez l’envoi des codes de connexion pour l’ensemble de la plateforme ou pour un tenant
          en particulier.
        </p>
      </header>

      <Tabs defaultValue="global" className="max-w-3xl">
        <TabsList>
          <TabsTrigger value="global">Global</TabsTrigger>
          <TabsTrigger value="tenant">Par tenant</TabsTrigger>
        </TabsList>

        <TabsContent value="global" className="mt-6">
          {globalSettings.isLoading || !globalSettings.data ? (
            <SettingsSkeleton />
          ) : (
            <TwoFactorSettingsForm
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
          ) : tenantSettings.isLoading || !tenantSettings.data ? (
            <SettingsSkeleton />
          ) : (
            <TwoFactorSettingsForm
              // Force la réinitialisation du formulaire au changement de tenant.
              key={tenantId}
              settings={tenantSettings.data.data}
              scope="tenant"
              templateMails={templateMails.data?.data ?? []}
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
