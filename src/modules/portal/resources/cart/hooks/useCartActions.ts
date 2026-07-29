import { toast } from 'sonner';

import { findCartItemByLearningPath } from '@/modules/portal/resources/cart/cart-utils';
import {
  useAddCartItem,
  useRemoveCartItem,
  useUpdateCartItem,
} from '@/modules/portal/resources/cart/hooks/useCartMutations';
import { useCartQuery } from '@/modules/portal/resources/cart/hooks/useCartQuery';
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

  const increase = async (cartItemId: string) => {
    try {
      await updateCartItem.mutateAsync({ itemId: cartItemId, delta: 1 });
      return true;
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Impossible d’augmenter la quantité.'));
      return false;
    }
  };

  const decrease = async (cartItemId: string, quantity: number) => {
    if (quantity <= 1) return false;
    try {
      await updateCartItem.mutateAsync({ itemId: cartItemId, delta: -1 });
      return true;
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Impossible de diminuer la quantité.'));
      return false;
    }
  };

  const remove = async (cartItemId: string) => {
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
      Boolean(learningPathId) &&
      addCartItem.isPending &&
      addCartItem.variables?.learning_path_id === learningPathId;
    const updating =
      Boolean(cartItemId) &&
      updateCartItem.isPending &&
      updateCartItem.variables?.itemId === cartItemId;
    const removing =
      Boolean(cartItemId) && removeCartItem.isPending && removeCartItem.variables === cartItemId;

    return adding || updating || removing;
  };

  return {
    cart,
    cartQuery,
    findItem,
    add,
    increase,
    decrease,
    remove,
    isMutatingFor,
  };
}
