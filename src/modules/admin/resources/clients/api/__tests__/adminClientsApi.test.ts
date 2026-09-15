/**
 * Tests unitaires — adminClientsApi
 * Vérifie que le listing tape bien l'endpoint plateforme.
 */

jest.mock('@/shared/lib/apiClient', () => ({
  apiGet: jest.fn(),
}));

import { apiGet } from '@/shared/lib/apiClient';
import { adminClientsApi } from '../index';

const mockApiGet = jest.mocked(apiGet);

describe('adminClientsApi', () => {
  beforeEach(() => jest.clearAllMocks());

  it('appelle GET platform/clients', async () => {
    mockApiGet.mockResolvedValue({ data: [] });

    await adminClientsApi.list();

    expect(mockApiGet).toHaveBeenCalledWith('platform/clients', undefined);
  });

  it('transmet le tenant vise quand il est fourni', async () => {
    mockApiGet.mockResolvedValue({ data: [] });

    await adminClientsApi.list('t-1');

    expect(mockApiGet).toHaveBeenCalledWith('platform/clients', {
      tenant_id: 't-1',
    });
  });

  it('retourne les clients renvoyés par le backend', async () => {
    mockApiGet.mockResolvedValue({
      data: [
        {
          id: 'c-1',
          tenant_id: 't-1',
          name: 'Globex',
          slug: 'globex',
          is_active: true,
        },
      ],
    });

    const res = await adminClientsApi.list();

    expect(res.data).toHaveLength(1);
    expect(res.data[0].name).toBe('Globex');
  });
});
