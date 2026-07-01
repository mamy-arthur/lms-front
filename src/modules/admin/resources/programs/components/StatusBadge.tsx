import { Badge } from "@/components/ui/badge";
import { Formation } from "./programs-table";

export function StatusBadge({ status }: { status: Formation["status"] }) {
    switch (status) {
        case "Publié":
            return (
                <Badge className="bg-green-500 hover:bg-green-500">
                    Publié
                </Badge>
            );

        case "Brouillon":
            return <Badge variant="secondary">Brouillon</Badge>;

        case "Archivé":
            return <Badge variant="destructive">Archivé</Badge>;
    }
}
