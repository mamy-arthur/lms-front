"use client";
import { useState } from "react";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import { useTenantsQuery } from "../hooks/useTenantsQuery";

const columns: GridColDef[] = [
  { field: "name",   headerName: "Nom",     flex: 1 },
  { field: "slug",   headerName: "Slug",    flex: 1 },
  { field: "domain", headerName: "Domaine", flex: 1 },
  { field: "status", headerName: "Statut",  width: 130 },
];

export function TenantList() {
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 25 });
  const [search, setSearch] = useState("");

  const { data, isLoading } = useTenantsQuery({
    page: paginationModel.page + 1,
    perPage: paginationModel.pageSize,
    q: search || undefined,
  });

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
        Tenants
      </Typography>

      <TextField
        size="small"
        placeholder="Rechercher..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 2, width: 280 }}
      />

      <DataGrid
        rows={data?.data ?? []}
        rowCount={data?.total ?? 0}
        columns={columns}
        loading={isLoading}
        paginationMode="server"
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        pageSizeOptions={[25, 50, 100]}
        disableRowSelectionOnClick
        autoHeight
      />
    </Box>
  );
}
