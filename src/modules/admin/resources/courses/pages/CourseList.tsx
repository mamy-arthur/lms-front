"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Chip from "@mui/material/Chip";
import { useCoursesQuery } from "../hooks/useCoursesQuery";
import { ROUTES } from "@/shared/constants/routes";

const columns: GridColDef[] = [
  { field: "title",       headerName: "Titre",   flex: 1 },
  { field: "slug",        headerName: "Slug",    flex: 1 },
  {
    field: "isPublished",
    headerName: "Publié",
    width: 120,
    renderCell: ({ value }) =>
      value ? (
        <Chip label="Publié" color="success" size="small" />
      ) : (
        <Chip label="Brouillon" size="small" />
      ),
  },
  { field: "createdAt", headerName: "Créé le", width: 180 },
];

export function CourseList() {
  const router = useRouter();
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 25 });
  const [search, setSearch] = useState("");

  const { data, isLoading } = useCoursesQuery({
    page: paginationModel.page + 1,
    perPage: paginationModel.pageSize,
    q: search || undefined,
  });

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
        Formations
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
        onRowClick={({ row }) => router.push(`${ROUTES.admin.courses}/${row.id}`)}
        disableRowSelectionOnClick
        autoHeight
        sx={{ cursor: "pointer" }}
      />
    </Box>
  );
}
