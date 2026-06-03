"use client";
import { useState } from "react";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useReportsQuery } from "../hooks/useReportsQuery";

const columns: GridColDef[] = [
  { field: "title",     headerName: "Titre", flex: 1 },
  { field: "type",      headerName: "Type",  width: 160 },
  { field: "createdAt", headerName: "Créé le", width: 180 },
];

export function ReportList() {
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 25 });

  const { data, isLoading } = useReportsQuery({
    page: paginationModel.page + 1,
    perPage: paginationModel.pageSize,
  });

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
        Rapports
      </Typography>

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
