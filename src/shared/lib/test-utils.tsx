import React from 'react';
import { render as rtlRender, type RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/**
 * `render` de Testing Library, enveloppé dans un QueryClientProvider.
 *
 * À utiliser dès qu'un composant (ou un de ses descendants) appelle un hook
 * TanStack Query — sans provider, le rendu échoue sur « No QueryClient set ».
 * En production le provider vient de `shared/lib/Providers.tsx`, monté à la
 * racine ; ce helper en est l'équivalent côté tests.
 *
 * Un QueryClient neuf est créé à chaque appel, pour qu'aucun cache ne fuite
 * d'un test à l'autre. `retry: false` évite de faire traîner les cas d'erreur.
 */
export function renderWithQueryClient(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return { queryClient, ...rtlRender(ui, { wrapper, ...options }) };
}
