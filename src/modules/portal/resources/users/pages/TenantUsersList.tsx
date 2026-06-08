"use client";

import { useState, useMemo, useCallback } from "react";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import AddIcon from "@mui/icons-material/Add";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { useTenantUsersQuery } from "../hooks/useTenantUsersQuery";
import { UserFormModal } from "../components/UserFormModal";
import type { TenantUser } from "../types";

// ─── Columns (référence stable — définie hors composant) ─────────────────────

const COLUMNS: GridColDef<TenantUser>[] = [
  { field: "name", headerName: "Nom", flex: 1, minWidth: 160 },
  { field: "email", headerName: "Email", flex: 1.5, minWidth: 200 },
  { field: "role", headerName: "Rôle", width: 180 },
  {
    field: "isActive",
    headerName: "Actif",
    type: "boolean",
    width: 100,
  },
  {
    field: "createdAt",
    headerName: "Créé le",
    width: 180,
    valueFormatter: (value: string) =>
      value ? new Date(value).toLocaleDateString("fr-FR") : "—",
  },
];

// ─── Component ───────────────────────────────────────────────────────────────

export function TenantUsersList() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState("");

  // Debounce 300 ms pour éviter un filtre à chaque frappe
  const debouncedSearch = useDebounce(search, 300);

  const { data: allUsers = [] } = useTenantUsersQuery();

  // Filtre côté client sur le mock — remplacé par un param API quand disponible
  const filteredUsers = useMemo(() => {
    if (!debouncedSearch) return allUsers;
    const q = debouncedSearch.toLowerCase();
    return allUsers.filter(
      (u) =>
        u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
    );
  }, [allUsers, debouncedSearch]);

  const handleOpenModal = useCallback(() => setIsModalOpen(true), []);

  const handleCloseModal = useCallback(() => setIsModalOpen(false), []);

  // Ferme la modale après création réussie
  const handleCreateSuccess = useCallback(() => setIsModalOpen(false), []);

  return (
    <Box sx={{ p: 3 }}>
      {/* En-tête */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Utilisateurs
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenModal}
        >
          Nouvel utilisateur
        </Button>
      </Box>

      {/* Recherche */}
      <TextField
        size="small"
        placeholder="Rechercher par nom ou email…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 2, width: 320 }}
        slotProps={{ htmlInput: { "aria-label": "Rechercher" } }}
      />

      {/* Tableau */}
      <DataGrid
        rows={filteredUsers}
        columns={COLUMNS}
        pageSizeOptions={[25, 50, 100]}
        initialState={{
          pagination: { paginationModel: { pageSize: 25 } },
        }}
        disableRowSelectionOnClick
        autoHeight
      />

      {/* Modale de création */}
      <UserFormModal
        open={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={handleCreateSuccess}
      />
    </Box>
  );
}
