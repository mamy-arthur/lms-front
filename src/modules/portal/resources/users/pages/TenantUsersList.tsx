"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus } from "lucide-react"
import { useDebounce } from "@/shared/hooks/useDebounce";
import { useTenantUsersQuery } from "../hooks/useTenantUsersQuery";
import { UserFormModal } from "../components/UserFormModal";
import { TenantUsersTable } from "./_components/tenant-users-table";

export function TenantUsersList() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(12);

  const debouncedSearch = useDebounce(search, 300);

  const { data: allUsers = [] } = useTenantUsersQuery();

  const filteredUsers = useMemo(() => {
    if (!debouncedSearch) return allUsers;
    const q = debouncedSearch.toLowerCase();
    return allUsers.filter(
      (u) =>
        u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
    );
  }, [allUsers, debouncedSearch]);

  const total = filteredUsers.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const paginatedUsers = useMemo(
    () => filteredUsers.slice(safePage * pageSize, (safePage + 1) * pageSize),
    [filteredUsers, safePage, pageSize],
  );

  useEffect(() => {
    setPage(0);
  }, [debouncedSearch]);

  const handleOpenModal = useCallback(() => setIsModalOpen(true), []);
  const handleCloseModal = useCallback(() => setIsModalOpen(false), []);
  const handleCreateSuccess = useCallback(() => setIsModalOpen(false), []);

  const handlePageChange = useCallback((newPage: number) => setPage(newPage), []);
  const handlePageSizeChange = useCallback(
    (newSize: number) => {
      setPageSize(newSize);
      setPage(0);
    },
    [],
  );

  return (
      <div className="space-y-3 p-3">     
       <div className="flex items-center justify-between">
        <h1 className="text-lg font-extrabold">
          Utilisateurs
        </h1>
        <Button
          onClick={handleOpenModal}
          size="lg"
          className="bg-(--color-primary) text-primary-foreground"
        >
          <Plus className="size-4" />
          Nouvel utilisateur
        </Button>
      </div>

      <Input placeholder="Rechercher par nom ou email…" className="w-80" aria-label="Rechercher" value={search} onChange={(e) => setSearch(e.target.value)} />

      <TenantUsersTable
        users={paginatedUsers}
        hasQuery={!!debouncedSearch}
        page={safePage}
        pageSize={pageSize}
        total={total}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onView={() => {}}
        onEdit={() => {}}
        onToggleActive={() => {}}
        onDelete={() => {}}
      />

      <UserFormModal
        open={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
}
