import { useEffect, useState } from 'react';
import { Minus, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CartQuantityControlsProps {
  quantity: number;
  onDecrease: () => void;
  onIncrease: () => void;
  onQuantityChange?: (quantity: number) => void;
  disabled?: boolean;
  className?: string;
}

export function CartQuantityControls({
  quantity,
  onDecrease,
  onIncrease,
  onQuantityChange,
  disabled = false,
  className,
}: CartQuantityControlsProps) {
  const [draft, setDraft] = useState(String(quantity));
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setDraft(String(quantity));
    }
  }, [quantity, isFocused]);

  const commitDraft = () => {
    setIsFocused(false);

    if (!onQuantityChange) {
      setDraft(String(quantity));
      return;
    }

    const parsed = Number.parseInt(draft, 10);
    if (!Number.isFinite(parsed) || parsed < 0 || draft.trim() === '') {
      setDraft(String(quantity));
      return;
    }

    if (parsed === quantity) {
      setDraft(String(quantity));
      return;
    }

    onQuantityChange(parsed);
  };

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-md border border-border p-1',
        className,
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={onDecrease}
        disabled={disabled}
        aria-label="Diminuer la quantité"
      >
        <Minus className="size-3" />
      </Button>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={draft}
        disabled={disabled || !onQuantityChange}
        aria-label="Quantité"
        className={cn(
          'h-6 w-10 rounded-sm bg-transparent text-center text-xs font-semibold tabular-nums outline-none',
          'focus-visible:ring-2 focus-visible:ring-ring/30',
          'disabled:cursor-not-allowed disabled:opacity-50',
        )}
        onFocus={(event) => {
          setIsFocused(true);
          event.target.select();
        }}
        onChange={(event) => {
          const next = event.target.value;
          if (next === '' || /^\d+$/.test(next)) {
            setDraft(next);
          }
        }}
        onBlur={commitDraft}
        onKeyDown={(event) => {
          event.stopPropagation();
          if (event.key === 'Enter') {
            event.currentTarget.blur();
          }
          if (event.key === 'Escape') {
            setDraft(String(quantity));
            setIsFocused(false);
            event.currentTarget.blur();
          }
        }}
        onClick={(event) => event.stopPropagation()}
      />
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
