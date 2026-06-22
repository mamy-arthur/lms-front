"use client";
import { useState } from "react";
import { TenantsTable } from "./_components/tenant-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CreateTenantWizard } from "../components/CreateTenantWizard";
import { Plus, Search } from "lucide-react";
import { useTenants } from "../hooks/useTenantsQuery";
import { Tenant } from "@/shared/types/tenants/tenant";
import { UpdateTenantWizard } from "../components/updateTenant";

export function TenantList() {
    const [selectedTenant, setSelectedTenant] = useState<Tenant | undefined>(
        undefined,
    );
    const [search, setSearch] = useState("");
    const [wizardOpen, setWizardOpen] = useState(false);
    const [isUpdateOpen, setIsUpdateOpen] = useState(false);
    const { data, isLoading } = useTenants();

    const handleEditTenant = (tenant: Tenant) => {
        setSelectedTenant(tenant);
        setIsUpdateOpen(true);
    };

    return (
        <div className="flex flex-col bg-background">
            {/* HEADER */}
            <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        Gestion des tenants
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Gérez les organisations de votre plateforme.
                    </p>
                </div>
                <Button
                    onClick={() => setWizardOpen(true)}
                    size="lg"
                    className="bg-(--color-primary) hover:bg-(--color-primary)/80 text-primary-foreground"
                >
                    <Plus className="size-4" />
                    Créer un tenant
                </Button>
            </header>

            <div className="space-y-4">
                {/* SEARCH BAR AREA */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="relative w-full sm:max-w-sm">
                        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Rechercher un tenant..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>

                    {/* Optionnel: filtres futurs */}
                    <div className="ml-auto text-xs"></div>
                </div>
                {/* TABLE WRAPPER */}
                <TenantsTable
                    tenants={data?.data ?? []}
                    onDelete={() => {}}
                    onView={() => {}}
                    onToggleSuspend={() => {}}
                    onImpersonate={() => {}}
                    onEdit={handleEditTenant}
                    isLoading={isLoading}
                />

                <CreateTenantWizard
                    open={wizardOpen}
                    onOpenChange={setWizardOpen}
                />
                <UpdateTenantWizard
                    open={isUpdateOpen}
                    onOpenChange={setIsUpdateOpen}
                    tenant={selectedTenant}
                />
            </div>
        </div>
    );
}
