"use client";
import { MenuItemLink, usePermissions } from "react-admin";
import { useLocation } from "react-router-dom";
import { NAV_ITEMS } from "@/appConfig/navigation";
import { canAccess } from "@/shared/auth/permissions";

export function CustomMenu() {
  const { permissions } = usePermissions();
  const location = useLocation();

  const visibleItems = NAV_ITEMS.filter((item) =>
    canAccess(permissions ?? null, item.access)
  );

  return (
    <nav className="mt-2">
      {visibleItems.map((item) => (
        <MenuItemLink
          key={item.to}
          to={item.to}
          primaryText={item.label}
          selected={location.pathname === item.to}
        />
      ))}
    </nav>
  );
}
