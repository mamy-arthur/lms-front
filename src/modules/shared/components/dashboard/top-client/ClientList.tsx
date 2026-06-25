import { CardContent } from "@/components/ui/card";
import { Client } from "./types";
import { ClientRow } from "./ClientRow";

type Props = {
    clients: Client[];
    onSelect: (client: Client) => void;
};

export function ClientList({ clients, onSelect }: Props) {
    return (
        <CardContent className="space-y-1 pt-2">
            {clients.map((client, index) => (
                <ClientRow
                    key={client.id}
                    client={client}
                    index={index}
                    onClick={() => onSelect(client)}
                />
            ))}
        </CardContent>
    );
}