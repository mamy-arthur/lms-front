import { Badge } from "@/components/ui/badge";
import { Formation } from "./programs-table";

import {
  CheckCircle2,
  FileText,
  Archive,
} from "lucide-react";

export function StatusBadge({
  status,
}: {
  status: Formation["status"];
}) {
  switch (status) {
    case "Publié":
      return (
        <Badge
          variant="outline"
          className="gap-1 border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50"
        >
          <CheckCircle2 className="size-3" />
          Publié
        </Badge>
      );

    case "Brouillon":
      return (
        <Badge
          variant="outline"
          className="gap-1 border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-50"
        >
          <FileText className="size-3" />
          Brouillon
        </Badge>
      );

    case "Archivé":
      return (
        <Badge
          variant="outline"
          className="gap-1 border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-50"
        >
          <Archive className="size-3" />
          Archivé
        </Badge>
      );

    default:
      return null;
  }
}