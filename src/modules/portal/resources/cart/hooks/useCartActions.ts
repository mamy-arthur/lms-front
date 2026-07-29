import { toast } from 'sonner';

import { findCartItemByLearningPath } from '@/modules/portal/resources/cart/cart-utils';
import {
  useAddCartItem,
  useRemoveCartItem,
  useUpdateCartItem,
} from '@/modules/portal/resources/cart/hooks/useCartMutations';
import { useCartQuery } from '@/modules/portal/resources/cart/hooks/useCartQuery';
import { useDebouncedCartQuantity } from '@/modules/portal/resources/cart/hooks/useDebouncedCartQuantity';
import { getApiErrorMessage } from '@/shared/lib/errors';

interface MutatingForOptions {
  learningPathId?: string;
  cartItemId?: string;
}

export function useCartActions() {
  const cartQuery = useCartQuery();
  const addCartItem = useAddCartItem();
  const updateCartItem = useUpdateCartItem();
  const removeCartItem = useRemoveCartItem();
  const quantityChanges = useDebouncedCartQuantity({
    updateItem: (args) => updateCartItem.mutateAsync(args),
    removeItem: (itemId) => removeCartItem.mutateAsync(itemId),
  });

  const cart = cartQuery.data?.data;

  const findItem = (learningPathId: string) => findCartItemByLearningPath(cart, learningPathId);

  const add = async (learningPathId: string, options?: { silentSuccess?: boolean }) => {
    try {
      await addCartItem.mutateAsync({ learning_path_id: learningPathId });
      if (!options?.silentSuccess) {
        toast.success('Formation ajoutée au panier.');
      }
      return true;
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Impossible d’ajouter cette formation au panier.'));
      return false;
    }
  };

  const increase = (cartItemId: string) => {
    quantityChanges.schedule(cartItemId, 1);
  };

  const decrease = (cartItemId: string) => {
    quantityChanges.schedule(cartItemId, -1);
  };

  const setQuantity = (cartItemId: string, quantity: number) => {
    quantityChanges.scheduleQuantity(cartItemId, quantity);
  };

  const remove = async (cartItemId: string) => {
    quantityChanges.clearPending(cartItemId);
    try {
      await removeCartItem.mutateAsync(cartItemId);
      toast.success('Formation retirée du panier.');
      return true;
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Impossible de retirer cette formation.'));
      return false;
    }
  };

  const isMutatingFor = ({ learningPathId, cartItemId }: MutatingForOptions) => {
    const adding =
      learningPathId != null &&
      addCartItem.isPending &&
      addCartItem.variables?.learning_path_id === learningPathId;
    const updating =
      cartItemId != null &&
      updateCartItem.isPending &&
      updateCartItem.variables?.itemId === cartItemId;
    const removing =
      cartItemId != null && removeCartItem.isPending && removeCartItem.variables === cartItemId;
    const syncing = cartItemId != null && quantityChanges.isSyncing(cartItemId);

    return adding || updating || removing || syncing;
  };

  return {
    cart,
    cartQuery,
    findItem,
    add,
    increase,
    decrease,
    setQuantity,
    remove,
    isMutatingFor,
  };
}
