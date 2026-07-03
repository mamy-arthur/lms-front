'use client';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './query-client';
import { TenantProvider } from '@/shared/components/providers/TenantProvider';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from 'sonner';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <TenantProvider>{children}</TenantProvider>
      </TooltipProvider>
      <Toaster richColors />
    </QueryClientProvider>
  );
}
