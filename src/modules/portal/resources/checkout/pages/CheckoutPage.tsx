'use client';

import { ShoppingCart, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useCheckoutController } from '../hooks/useCheckoutController';
import { CheckoutSuccessDialog } from './_components/CheckoutSuccessDialog';
import { CheckoutUserInfo } from './_components/CheckoutUserInfo';
import { CheckoutPaymentMethod } from './_components/CheckoutPaymentMethod';
import { CheckoutOrderSummary } from './_components/CheckoutOrderSummary';

export function CheckoutPage() {
  const {
    isLoading,
    isError,
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
    navigateToFormations,
    navigateToStore,
  } = useCheckoutController();

  if (paid) {
    return (
      <CheckoutSuccessDialog
        open={paid}
        paidTotal={paidTotal}
        paidCurrency={paidCurrency}
        onNavigate={navigateToFormations}
      />
    );
  }

  if (isLoading) {
    return <CheckoutSkeleton />;
  }

  if (isError || !cart) {
    return (
      <div className="mx-auto max-w-sm px-4 py-20 text-center">
        <p className="text-sm font-medium">Impossible de charger le panier</p>
        <p className="mt-1 text-xs text-muted-foreground">Réessayez dans un instant.</p>
        <Button variant="outline" className="mt-6" onClick={navigateToStore}>
          Retour à la boutique
        </Button>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="mx-auto max-w-sm px-4 py-20 text-center">
        <div className="mb-4 flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <ShoppingCart className="size-5 text-muted-foreground" />
          </div>
        </div>
        <p className="text-sm font-medium">Votre panier est vide</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Ajoutez des formations pour pouvoir passer à la caisse.
        </p>
        <Button variant="outline" className="mt-6" onClick={navigateToStore}>
          Voir les formations
        </Button>
      </div>
    );
  }

  return (
    <div className="px-4">
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight">Finaliser votre commande</h1>
        <p className="mt-1.5 text-xs text-muted-foreground">
          Vérifiez votre commande puis choisissez votre moyen de paiement.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[60%_1fr]">
        <CheckoutOrderSummary
          cartItems={cartItems}
          cartCount={cartCount}
          subtotal={subtotal}
          total={total}
          currency={currency}
          discount={discount}
        />
        <div className="space-y-4">
          <section className="rounded-sm border border-border bg-card p-6 flex flex-col space-y-5">
            <h2 className="mb-4 text-xs font-semibold">Mode de paiement</h2>
            <CheckoutUserInfo name={user?.name ?? ''} email={user?.email ?? ''} />
            <CheckoutPaymentMethod
              value={paymentMethod}
              onChange={setPaymentMethod}
              disabled={isSubmitting}
            />
            <Button
              type="button"
              className="h-9 w-full bg-(--color-primary) text-xs font-semibold hover:bg-(--color-primary)/80 disabled:opacity-60"
              disabled={isSubmitting}
              onClick={handlePay}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Traitement du paiement...
                </>
              ) : (
                <>Payer maintenant</>
              )}
            </Button>
          </section>
        </div>
      </div>
    </div>
  );
}

function CheckoutSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <Skeleton className="mb-8 h-4 w-32" />
      <Skeleton className="mb-2 h-7 w-56" />
      <Skeleton className="mb-8 h-4 w-80" />
      <div className="grid gap-8 lg:grid-cols-[60%_1fr]">
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-44 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
        <Skeleton className="h-80 w-full rounded-xl" />
      </div>
    </div>
  );
}
