import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { getCartItemCount, getCartSubtotal } from '@/modules/portal/resources/cart/cart-utils';
import { useCartQuery } from '@/modules/portal/resources/cart/hooks/useCartQuery';
import { useCreateOrder } from '@/modules/portal/resources/cart/hooks/useCreateOrder';
import { getApiErrorMessage } from '@/shared/lib/errors';
import { ROUTES } from '@/shared/constants/routes';
import { useSimulationUser } from '@/shared/simulation/useSimulationUser';
import type { PaymentMethod } from '@/shared/types/order.types';

export function useCheckoutController() {
  const router = useRouter();
  const cartQuery = useCartQuery();
  const createOrder = useCreateOrder();
  const user = useSimulationUser();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [paid, setPaid] = useState(false);
  const [paidTotal, setPaidTotal] = useState(0);
  const [paidCurrency, setPaidCurrency] = useState('EUR');

  const cart = cartQuery.data?.data;
  const cartItems = cart?.items ?? [];
  const cartCount = cart ? getCartItemCount(cart) : 0;
  const subtotal = cart ? getCartSubtotal(cartItems) : 0;
  const total = cart?.total ?? 0;
  const currency = cart?.currency ?? 'EUR';
  const discount = subtotal - total;
  const isSubmitting = createOrder.isPending;

  const handlePay = async () => {
    try {
      await createOrder.mutateAsync({ payment_method: paymentMethod });
      setPaidTotal(total);
      setPaidCurrency(currency);
      setPaid(true);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Impossible de valider la commande.'));
    }
  };

  return {
    isLoading: cartQuery.isLoading,
    isError: cartQuery.isError,
    cart,
    cartItems,
    cartCount,
    subtotal,
    total,
    currency,
    discount,
    user,
    paymentMethod,
    setPaymentMethod,
    isSubmitting,
    handlePay,
    paid,
    paidTotal,
    paidCurrency,
    navigateToFormations: () => router.push(ROUTES.portal.formations),
    navigateToStore: () => router.push(ROUTES.portal.store),
  };
}
