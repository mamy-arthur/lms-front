"use client";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./query-client";
import { TenantProvider } from "@/shared/components/providers/TenantProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <TenantProvider>{children}</TenantProvider>
    </QueryClientProvider>
  );
}
