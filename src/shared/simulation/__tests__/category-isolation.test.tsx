import { renderHook, waitFor, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePurchasedLearningPathCategoriesQuery } from '@/modules/portal/resources/purchased-learning-paths/hooks/usePurchasedLearningPathCategoriesQuery';
import { useLearningPathCategoriesQuery } from '@/modules/admin/resources/programs/hooks/useLearningPathCategoriesQuery';
import { Role } from '@/shared/constants/roles';
import { useAuthStore } from '@/shared/stores/auth.store';
import { useSimulationStore } from '../simulation.store';
import { resetSimulationData, clearSimulationData } from '../local-api';

let client: QueryClient;
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={client}>{children}</QueryClientProvider>
);
beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  useAuthStore.setState({ simulatedRole: Role.CLIENT_MANAGER, role: Role.CLIENT_MANAGER });
  useSimulationStore.setState({ phase: 'ready' });
  resetSimulationData(Role.CLIENT_MANAGER);
  global.fetch = jest.fn().mockRejectedValue(new Error('Unexpected network call'));
});
afterEach(() => {
  cleanup();
  client.clear();
  clearSimulationData();
  useAuthStore.getState().clearAuth();
  useSimulationStore.setState({ phase: 'idle' });
});

it('client/trainee formations use fictional categories, never live shop categories', async () => {
  const hook = renderHook(usePurchasedLearningPathCategoriesQuery, { wrapper });
  await waitFor(() => expect(hook.result.current.isSuccess).toBe(true));
  expect(hook.result.current.data?.[0].name).toContain('démonstration');
  expect(fetch).not.toHaveBeenCalled();
});

it('editor management and shop category caches are independent', async () => {
  useAuthStore.getState().setSimulatedRole(Role.EDITOR);
  (fetch as jest.Mock).mockResolvedValue({
    ok: true,
    status: 200,
    headers: new Headers(),
    text: async () => JSON.stringify({ data: [{ id: 'real-category', name: 'Catégorie réelle' }] }),
  });
  const management = renderHook(() => useLearningPathCategoriesQuery(), { wrapper });
  const shop = renderHook(() => useLearningPathCategoriesQuery(true), { wrapper });
  await waitFor(() =>
    expect(management.result.current.isSuccess && shop.result.current.isSuccess).toBe(true),
  );
  expect(management.result.current.data?.[0].name).toContain('démonstration');
  expect(shop.result.current.data?.[0].name).toBe('Catégorie réelle');
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(fetch).toHaveBeenCalledWith(
    '/api/v1/role-simulation/shop/learning-path-categories',
    expect.anything(),
  );
});
