"use client";
import { useState } from "react";
// import { useTenantsQuery } from "../hooks/useTenantsQuery";
import { TenantsTable } from "./_components/tenant-table";
import { MOCK_TENANTS } from "@/shared/mocks/tenant/mock-tenants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CreateTenantWizard } from "../components/CreateTenantWizard";
import { Plus, Search } from "lucide-react";

export function TenantList() {
    const [paginationModel, setPaginationModel] = useState({
        page: 0,
        pageSize: 25,
    });
    const [search, setSearch] = useState("");

    const [wizardOpen, setWizardOpen] = useState(false);

    // const { data, isLoading } = useTenantsQuery({
    //   page: paginationModel.page + 1,
    //   perPage: paginationModel.pageSize,
    //   q: search || undefined,
    // });

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
                    <div className="ml-auto text-xs">
                        {MOCK_TENANTS.length} tenants
                    </div>
                </div>
                {/* TABLE WRAPPER */}
                <TenantsTable
                    tenants={MOCK_TENANTS}
                    onDelete={() => {}}
                    onView={() => {}}
                    onToggleSuspend={() => {}}
                    onImpersonate={() => {}}
                    onEdit={() => {}}
                />

                <CreateTenantWizard
                    open={wizardOpen}
                    onOpenChange={setWizardOpen}
                />
            </div>
        </div>
    );
}
