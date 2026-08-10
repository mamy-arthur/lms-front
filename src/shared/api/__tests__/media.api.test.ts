jest.mock('@/shared/lib/apiClient', () => ({
  apiGet: jest.fn(),
  apiDelete: jest.fn(),
  apiUpload: jest.fn(),
}));

import { apiDelete, apiGet, apiUpload } from '@/shared/lib/apiClient';
import { mediaApi } from '../media.api';

const mockApiGet = jest.mocked(apiGet);
const mockApiDelete = jest.mocked(apiDelete);
const mockApiUpload = jest.mocked(apiUpload);

describe('mediaApi', () => {
  beforeEach(() => jest.clearAllMocks());

  it('uploads media with FormData', async () => {
    mockApiUpload.mockResolvedValue({ data: { id: 'm-1' } });
    const file = new File(['hello'], 'doc.pdf', { type: 'application/pdf' });

    await mediaApi.upload(file, 'ct-1', 'field-1');

    expect(mockApiUpload).toHaveBeenCalledWith('platform/media', expect.any(FormData));
  });

  it('uploads inline media with FormData', async () => {
    mockApiUpload.mockResolvedValue({ data: { id: 'm-2' } });
    const file = new File(['img'], 'img.png', { type: 'image/png' });

    await mediaApi.uploadInline(file, 'ct-1', 'field-1');

    expect(mockApiUpload).toHaveBeenCalledWith('platform/inline-media', expect.any(FormData));
  });

  it('gets and deletes media by id', async () => {
    mockApiGet.mockResolvedValue({ data: { id: 'm-1' } });
    mockApiDelete.mockResolvedValue(undefined);

    await mediaApi.get('m-1');
    await mediaApi.delete('m-1');

    expect(mockApiGet).toHaveBeenCalledWith('platform/media/m-1');
    expect(mockApiDelete).toHaveBeenCalledWith('platform/media/m-1');
  });
});
