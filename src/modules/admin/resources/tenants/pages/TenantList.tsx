"use client";
import { useState } from "react";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
// import { useTenantsQuery } from "../hooks/useTenantsQuery";
import { TenantsTable } from "./_components/tenant-table";
import { MOCK_TENANTS } from "@/shared/mocks/tenant/mock-tenants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const columns: GridColDef[] = [
    { field: "name", headerName: "Nom", flex: 1 },
    { field: "slug", headerName: "Slug", flex: 1 },
    { field: "domain", headerName: "Domaine", flex: 1 },
    { field: "status", headerName: "Statut", width: 130 },
];

export function TenantList() {
    const [paginationModel, setPaginationModel] = useState({
        page: 0,
        pageSize: 25,
    });
    const [search, setSearch] = useState("");

    // const { data, isLoading } = useTenantsQuery({
    //   page: paginationModel.page + 1,
    //   perPage: paginationModel.pageSize,
    //   q: search || undefined,
    // });

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {/* HEADER */}
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                }}
            >
                <Typography variant="h5" sx={{ fontWeight: 800 }}>
                    Tenants
                </Typography>
                <Button color="" variant="secondary">Nouveau tenant</Button>
            </Box>

            {/* SEARCH BAR AREA */}
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    p: 1,
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 2,
                    backgroundColor: "background.paper",
                }}
            >
                <Input
                    placeholder="Rechercher un tenant..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{
                        width: 320,
                    }}
                />

                {/* Optionnel: filtres futurs */}
                <Box sx={{ ml: "auto", opacity: 0.7, fontSize: 13 }}>
                    {MOCK_TENANTS.length} tenants
                </Box>
            </Box>
            {/* TABLE WRAPPER */}
            <TenantsTable
                tenants={MOCK_TENANTS}
                onDelete={() => {}}
                onView={() => {}}
                onToggleSuspend={() => {}}
                onImpersonate={() => {}}
                onEdit={() => {}}
            />
        </Box>
    );
}
