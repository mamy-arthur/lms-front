import { Minus, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CartQuantityControlsProps {
  quantity: number;
  onDecrease: () => void;
  onIncrease: () => void;
  disabled?: boolean;
  className?: string;
}

export function CartQuantityControls({
  quantity,
  onDecrease,
  onIncrease,
  disabled = false,
  className,
}: CartQuantityControlsProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-md border border-border p-1',
        className,
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={onDecrease}
        disabled={disabled || quantity <= 1}
        aria-label="Diminuer la quantité"
      >
        <Minus className="size-3" />
      </Button>
      <span className="min-w-6 text-center text-xs font-semibold">{quantity}</span>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={onIncrease}
        disabled={disabled}
        aria-label="Augmenter la quantité"
      >
        <Plus className="size-3" />
      </Button>
    </div>
  );
}
