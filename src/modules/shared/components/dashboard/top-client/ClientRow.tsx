import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getInitials } from '@/shared/lib/string/getInitials';
import { Client } from './types';
import { rankColors } from './constants';

type Props = {
  client: Client;
  index: number;
  onClick: () => void;
};

export function ClientRow({ client, index, onClick }: Props) {
  const color = rankColors[index];

  return (
    <div
      className="flex items-center justify-between rounded-xl px-3 py-4 bg-gray-100/50 cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-center gap-3 min-w-0">
        <Avatar className="h-8 w-8">
          <AvatarFallback className={`text-xs font-semibold ${color.bg} ${color.text}`}>
            {getInitials(client.name)}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0">
          <p className="truncate text-xs font-medium">{client.name}</p>
          <p className="truncate text-xs text-muted-foreground">{client.email}</p>
        </div>
      </div>

      <div className="hidden text-right sm:block">
        <p className="text-sm font-semibold">{client.wallet.toFixed(2)} €</p>
        <p className="text-xs text-muted-foreground">solde</p>
      </div>
    </div>
  );
}
