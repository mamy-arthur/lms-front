import { useState } from 'react';
import { Bell, AlertTriangle, ShoppingCart } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { CartDrawer } from '@/modules/portal/resources/cart/CartDrawer';
import { useCartStore } from '@/modules/portal/resources/cart/CartStore';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export function AppHeader() {
  const [cartOpen, setCartOpen] = useState(false);
  const cartCount = useCartStore((state) => state.cartCount);

  return (
    <>
      <header className="flex h-15 shrink-0 items-center justify-between gap-2 px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        {/* LEFT */}
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="h-4" />
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-1">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative h-9 w-9 rounded-full hover:bg-accent bg-gray-100"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              sideOffset={12}
              className="w-80 overflow-hidden rounded-xl border-border/60 p-0 shadow-lg"
            >
              <div className="flex items-center justify-between border-b bg-muted/40 px-4 py-3">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-semibold">Notifications</p>
                </div>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                  0 nouveau
                </span>
              </div>
              <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <Bell className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium">Tout est à jour</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Vous n'avez aucune nouvelle notification
                </p>
              </div>
            </PopoverContent>
          </Popover>

          {/* ALERTS */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative h-9 w-9 rounded-full hover:bg-accent bg-gray-100"
                aria-label="Alertes"
              >
                <AlertTriangle className="h-4.5 w-4.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              sideOffset={12}
              className="w-80 overflow-hidden rounded-xl border-border/60 p-0 shadow-lg"
            >
              <div className="flex items-center justify-between border-b bg-muted/40 px-4 py-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  <p className="text-sm font-semibold">Alertes système</p>
                </div>
                <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Opérationnel
                </span>
              </div>
              <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
                <p className="text-sm font-medium">Tout est stable</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Aucun incident détecté sur vos services
                </p>
              </div>
            </PopoverContent>
          </Popover>

          <Button
            variant="ghost"
            size="icon"
            className="relative h-9 w-9 rounded-full hover:bg-accent bg-gray-100"
            aria-label="Panier"
            onClick={() => setCartOpen(true)}
          >
            <ShoppingCart className="h-4.5 w-4.5" />
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-(--color-primary) px-1 text-[10px] font-semibold text-primary-foreground ring-2 ring-background">
              {cartCount}
            </span>
          </Button>
        </div>
      </header>

      <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />
    </>
  );
}
