"use client";

import { Mail, CheckCircle2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { MailTemplateActions } from "@modules/shared/components/mail-templates";
import {
  DataTable,
  type DataTableColumn,
  type DataTableSort,
} from "@/shared/components/ui/DataTable";
import { formatDate } from "@/shared/lib/date";
import type { MailTemplate } from "../../types";

export type SortConfig = DataTableSort;

interface AdminMailTemplatesTableProps {
  templates: MailTemplate[];
  isLoading?: boolean;
  hasQuery?: boolean;
  page: number;
  pageSize: number;
  total: number;
  sort?: SortConfig;
  onSort?: (column: string) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onEdit: (template: MailTemplate) => void;
  onDelete?: (template: MailTemplate) => void;
  tenantNames: Record<string, string>;
}

export function AdminMailTemplatesTable({
  templates,
  isLoading = false,
  hasQuery = false,
  page,
  pageSize,
  total,
  sort,
  onSort,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onDelete,
  tenantNames,
}: AdminMailTemplatesTableProps) {
  const columns: DataTableColumn<MailTemplate>[] = [
    {
      key: "name",
      label: "Nom",
      sortable: true,
      render: (tpl) => (
        <span className="text-xs font-medium text-foreground">{tpl.name}</span>
      ),
    },
    {
      key: "subject",
      label: "Sujet",
      sortable: false,
      render: (tpl) => (
        <span className="text-xs text-muted-foreground truncate max-w-xs block">
          {tpl.subject}
        </span>
      ),
    },
    {
      key: "isActive",
      label: "Statut",
      sortable: false,
      render: (tpl) =>
        tpl.isActive ? (
          <Badge
            variant="outline"
            className="gap-1 border-emerald-200 bg-emerald-50 text-emerald-700"
          >
            <CheckCircle2 className="size-3" />
            Actif
          </Badge>
        ) : (
          <Badge
            variant="outline"
            className="gap-1 border-rose-200 bg-rose-50 text-rose-700"
          >
            <XCircle className="size-3" />
            Inactif
          </Badge>
        ),
    },
    {
      key: "id",
      label: "Actions",
      sortable: false,
      render: (tpl) => (
        <MailTemplateActions
          templateLabel={tpl.name}
          onEdit={() => onEdit(tpl)}
          onDelete={() => onDelete?.(tpl)}
        />
      ),
    },
  ];

  return (
    <DataTable
      data={templates}
      columns={columns}
      isLoading={isLoading}
      hasQuery={hasQuery}
      page={page}
      pageSize={pageSize}
      total={total}
      sort={sort}
      onSort={onSort}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      emptyState={{
        icon: <Mail className="size-8 text-muted-foreground" />,
        title: "Aucun template mail",
        description:
          "Créez votre premier template mail en cliquant sur « Nouveau template ».",
      }}
    />
  );
}
