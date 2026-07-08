import { WalletIcon, CoinsIcon, LockIcon } from 'lucide-react';

interface WalletSummaryCardsProps {
  totalPoints: number;
  principalBalance: number;
  nonRefundableBalance: number;
}

export function WalletSummaryCards({
  totalPoints,
  principalBalance,
  nonRefundableBalance,
}: WalletSummaryCardsProps) {
  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <WalletIcon className="size-4 text-(--color-primary) sm:size-5" />
      <div>
        <p className="text-sm font-semibold sm:text-base">{totalPoints}</p>
        <p className="text-[10px] leading-tight text-muted-foreground sm:text-xs">
          Solde disponible
        </p>
      </div>
      <div className="ml-1 h-8 w-px bg-border sm:ml-2 sm:h-10" />
      <CoinsIcon className="size-4 text-blue-600 sm:size-5" />
      <div>
        <p className="text-sm font-semibold sm:text-base">{principalBalance}</p>
        <p className="text-[10px] leading-tight text-muted-foreground sm:text-xs">
          Solde principal
        </p>
      </div>
      <div className="ml-1 h-8 w-px bg-border sm:ml-2 sm:h-10" />
      <LockIcon className="size-4 text-green-600 sm:size-5" />
      <div>
        <p className="text-sm font-semibold sm:text-base">{nonRefundableBalance}</p>
        <p className="text-[10px] leading-tight text-muted-foreground sm:text-xs">
          Solde non remboursable
        </p>
      </div>
    </div>
  );
}
