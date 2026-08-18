'use client';

import { useState } from 'react';
import { Bell, ShoppingCart, LogOut, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { CartDrawer } from '@/modules/portal/resources/cart/CartDrawer';
import { getCartItemCount } from '@/modules/portal/resources/cart/cart-utils';
import { useCartQuery } from '@/modules/portal/resources/cart/hooks/useCartQuery';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuthStore } from '@/shared/stores/auth.store';
import { getInitials } from '@/shared/lib/string/getInitials';
import { ROUTES } from '@/shared/constants/routes';
import { Role } from '@/shared/constants/roles';

interface AppHeaderProps {
  onLogout?: () => void;
}

function formatRole(role?: string | null) {
  if (!role) return 'Aucun role';
  const normalized = role.toLowerCase().replace(/_/g, ' ');
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export function AppHeader({ onLogout }: AppHeaderProps) {
  const [cartOpen, setCartOpen] = useState(false);
  const cartQuery = useCartQuery();
  const cartCount = getCartItemCount(cartQuery.data?.data);
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin') ?? false;
  const { user } = useAuthStore();
  const profileHref = isAdmin ? ROUTES.admin.profile : ROUTES.portal.profile;
  const roleLabel = formatRole(user?.role);

  return (
    <>
      <header className="sticky top-0 z-40 flex h-15 shrink-0 items-center justify-between gap-2 px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 border-b border-border/60 bg-background/80 backdrop-blur-md">
        {/* LEFT */}
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="h-4" />
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                size="icon"
                className="relative h-9 w-9 hover:bg-accent bg-gray-200/50 text-black"
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

          {/* CART — ClientManager uniquement */}
          {user?.role === Role.CLIENT_MANAGER && (
            <Button
              size="icon"
              className="relative h-9 w-9 hover:bg-accent bg-gray-200/50 text-black"
              aria-label="Panier"
              onClick={() => setCartOpen(true)}
            >
              <ShoppingCart className="h-4.5 w-4.5" />
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-(--color-primary) px-1 text-[10px] font-semibold text-primary-foreground ring-2 ring-background">
                {cartCount}
              </span>
            </Button>
          )}

          {/* USER MENU */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="h-9 max-w-45 rounded-full px-1.5 py-2 bg-transparent hover:bg-gray-100 sm:gap-2 sm:px-2">
                <Avatar className="h-8 w-8 rounded-full">
                  <AvatarImage src={user?.avatar ?? undefined} alt={user?.name ?? ''} />
                  <AvatarFallback className="rounded-full bg-(--color-primary) text-[11px] font-semibold text-white">
                    {getInitials(user?.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden flex-col items-start sm:flex">
                  <span className="hidden max-w-27.5 truncate text-xs text-black font-medium sm:inline">
                    {user?.name ?? 'Utilisateur'}
                  </span>
                  <span className="hidden max-w-30 truncate text-xs text-muted-foreground md:inline">
                    {roleLabel}
                  </span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="p-0 font-normal cursor-pointer">
                <div className="flex items-center gap-2 px-1 py-1.5 cursor-pointer">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={user?.avatar ?? undefined} />
                    <AvatarFallback className="rounded-lg bg-(--color-primary) text-[11px] font-semibold text-white">
                      {getInitials(user?.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{user?.name}</span>
                    <span className="truncate text-xs text-muted-foreground">{user?.email}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                  <Link href={profileHref}>
                    <User className="mr-2 size-4" />
                    Profil
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onLogout} variant="destructive">
                <LogOut className="mr-2 size-4" />
                Se déconnecter
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {user?.role === Role.CLIENT_MANAGER && (
        <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />
      )}
    </>
  );
}
