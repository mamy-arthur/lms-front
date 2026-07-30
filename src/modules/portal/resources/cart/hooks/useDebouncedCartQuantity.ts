import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { withCartItemQuantity } from '@/modules/portal/resources/cart/cart-utils';
import { getApiErrorMessage } from '@/shared/lib/errors';
import { cartKeys } from '@/shared/queries/keys';
import type { ApiCartItem, ApiCartResponse } from '@/shared/types/cart.types';

const QUANTITY_DEBOUNCE_MS = 300;

interface PendingQuantityChange {
  baseQuantity: number;
  quantity: number;
  itemSnapshot: ApiCartItem;
  timer: ReturnType<typeof setTimeout>;
}

interface QuantityChangeContext {
  existing?: PendingQuantityChange;
  itemSnapshot: ApiCartItem;
  baseQuantity: number;
  pendingQuantity: number;
}

interface UseDebouncedCartQuantityOptions {
  updateItem: (args: { itemId: string; quantity: number }) => Promise<unknown>;
  removeItem: (itemId: string) => Promise<unknown>;
}

export function useDebouncedCartQuantity({
  updateItem,
  removeItem,
}: UseDebouncedCartQuantityOptions) {
  const queryClient = useQueryClient();
  const pendingRef = useRef(new Map<string, PendingQuantityChange>());
  const [syncingItemIds, setSyncingItemIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    const pendingByItem = pendingRef.current;
    return () => {
      for (const pending of pendingByItem.values()) {
        clearTimeout(pending.timer);
      }
      pendingByItem.clear();
    };
  }, []);

  const applyOptimisticQuantity = (
    cartItemId: string,
    nextQuantity: number,
    itemSnapshot: ApiCartItem,
  ) => {
    queryClient.setQueryData<ApiCartResponse>(cartKeys.active(), (prev) => {
      if (!prev?.data) return prev;
      return {
        ...prev,
        data: withCartItemQuantity(prev.data, cartItemId, nextQuantity, itemSnapshot),
      };
    });
  };

  const getQuantityChangeContext = (cartItemId: string): QuantityChangeContext | null => {
    const existing = pendingRef.current.get(cartItemId);
    const currentCart = queryClient.getQueryData<ApiCartResponse>(cartKeys.active())?.data;
    const currentItem = currentCart?.items.find((item) => item.id === cartItemId);
    const itemSnapshot = existing?.itemSnapshot ?? currentItem;

    if (!itemSnapshot) return null;

    const baseQuantity = existing?.baseQuantity ?? itemSnapshot.quantity;

    return {
      existing,
      itemSnapshot,
      baseQuantity,
      pendingQuantity: existing?.quantity ?? baseQuantity,
    };
  };

  const clearPending = (cartItemId: string) => {
    const pending = pendingRef.current.get(cartItemId);
    if (!pending) return;
    clearTimeout(pending.timer);
    pendingRef.current.delete(cartItemId);
  };

  const setItemSyncing = (cartItemId: string, syncing: boolean) => {
    setSyncingItemIds((prev) => {
      const next = new Set(prev);
      if (syncing) next.add(cartItemId);
      else next.delete(cartItemId);
      return next;
    });
  };

  const flushQuantityChange = async (cartItemId: string) => {
    const pending = pendingRef.current.get(cartItemId);
    if (!pending) return;
    pendingRef.current.delete(cartItemId);

    const { baseQuantity, quantity } = pending;
    if (quantity === baseQuantity) return;

    setItemSyncing(cartItemId, true);

    try {
      if (quantity <= 0) {
        await removeItem(cartItemId);
        toast.success('Formation retirée du panier.');
        return;
      }

      await updateItem({ itemId: cartItemId, quantity });
    } catch (err) {
      toast.error(
        getApiErrorMessage(
          err,
          quantity <= 0
            ? 'Impossible de retirer cette formation.'
            : 'Impossible de mettre à jour la quantité.',
        ),
      );
      await queryClient.invalidateQueries({ queryKey: cartKeys.active() });
    } finally {
      setItemSyncing(cartItemId, false);
    }
  };

  const scheduleQuantity = (cartItemId: string, nextQuantity: number) => {
    const context = getQuantityChangeContext(cartItemId);
    if (!context) return;

    if (context.existing) clearTimeout(context.existing.timer);

    const quantity = Math.max(0, Math.floor(nextQuantity));
    applyOptimisticQuantity(cartItemId, quantity, context.itemSnapshot);

    pendingRef.current.set(cartItemId, {
      baseQuantity: context.baseQuantity,
      quantity,
      itemSnapshot: context.itemSnapshot,
      timer: setTimeout(() => {
        void flushQuantityChange(cartItemId);
      }, QUANTITY_DEBOUNCE_MS),
    });
  };

  const schedule = (cartItemId: string, step: 1 | -1) => {
    const context = getQuantityChangeContext(cartItemId);
    if (!context) return;
    scheduleQuantity(cartItemId, context.pendingQuantity + step);
  };

  const isSyncing = (cartItemId: string) => syncingItemIds.has(cartItemId);

  return {
    schedule,
    scheduleQuantity,
    clearPending,
    isSyncing,
  };
}
