jest.mock('@/shared/api/courses.api', () => ({
  coursesApi: {
    list: jest.fn().mockResolvedValue({ data: [] }),
    update: jest.fn().mockResolvedValue({ data: {} }),
    remove: jest.fn().mockResolvedValue(undefined),
  },
}));

const mockGetById = jest.fn();
jest.mock('@/modules/admin/resources/modules/api', () => ({
  adminModulesApi: { getById: (...args: unknown[]) => mockGetById(...args) },
}));

import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { competencyKeys, courseKeys } from '@/shared/queries/keys';
import { useModule } from '@/modules/admin/resources/modules/hooks/useModule';
import { useCourseData } from '../useCourseData';

function setup() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const invalidateQueries = jest.spyOn(queryClient, 'invalidateQueries');
  const { result } = renderHook(() => useCourseData(), {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  });
  return { result, invalidateQueries };
}

describe('useCourseData', () => {
  it('invalide aussi les modules au renommage, puisqu’ils embarquent le nom de leurs cours', async () => {
    const { result, invalidateQueries } = setup();

    await act(async () => {
      await result.current.updateMutation.mutateAsync({ id: 'course-1', full_name: 'Renommé' });
    });

    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: courseKeys.lists() });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: competencyKeys.all });
  });

  it('invalide aussi les modules à la suppression d’un cours', async () => {
    const { result, invalidateQueries } = setup();

    await act(async () => {
      await result.current.deleteMutation.mutateAsync('course-1');
    });

    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: competencyKeys.all });
  });

  it('rafraîchit un module déjà monté après renommage d’un de ses cours, sans le démonter', async () => {
    mockGetById
      .mockResolvedValueOnce({
        data: {
          id: 'mod-1',
          idnumber: 'MOD-1',
          courses: [
            { course_id: 'course-1', position: 0, full_name: 'Ancien nom', category_name: null },
          ],
        },
      })
      .mockResolvedValueOnce({
        data: {
          id: 'mod-1',
          idnumber: 'MOD-1',
          courses: [
            { course_id: 'course-1', position: 0, full_name: 'Renommé', category_name: null },
          ],
        },
      });

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result: moduleResult } = renderHook(() => useModule('MOD-1', 'mod-1'), { wrapper });
    await waitFor(() =>
      expect(moduleResult.current.data?.courses?.[0].fullName).toBe('Ancien nom'),
    );

    const { result: courseDataResult } = renderHook(() => useCourseData(), { wrapper });
    await act(async () => {
      await courseDataResult.current.updateMutation.mutateAsync({
        id: 'course-1',
        full_name: 'Renommé',
      });
    });

    await waitFor(() => expect(moduleResult.current.data?.courses?.[0].fullName).toBe('Renommé'));
    expect(mockGetById).toHaveBeenCalledTimes(2);
  });
});
