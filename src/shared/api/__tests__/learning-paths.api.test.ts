jest.mock('@/shared/lib/apiClient', () => ({
  apiGet: jest.fn(),
  apiPost: jest.fn(),
  apiPatch: jest.fn(),
  apiDelete: jest.fn(),
  apiUpload: jest.fn(),
}));

import { apiDelete, apiGet, apiPatch, apiPost, apiUpload } from '@/shared/lib/apiClient';
import {
  clientShopApi,
  editorShopApi,
  learningPathCategoriesApi,
  learningPathsApi,
} from '../learning-paths.api';

const mockApiGet = jest.mocked(apiGet);
const mockApiPost = jest.mocked(apiPost);
const mockApiPatch = jest.mocked(apiPatch);
const mockApiDelete = jest.mocked(apiDelete);
const mockApiUpload = jest.mocked(apiUpload);

describe('learning paths APIs', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('learningPathCategoriesApi', () => {
    it('calls expected endpoints', async () => {
      mockApiGet.mockResolvedValue({ data: [] });
      mockApiPost.mockResolvedValue({ data: { id: 'cat-1' } });
      mockApiPatch.mockResolvedValue({ data: { id: 'cat-1' } });
      mockApiDelete.mockResolvedValue(undefined);

      await learningPathCategoriesApi.list();
      await learningPathCategoriesApi.get('cat-1');
      await learningPathCategoriesApi.create({ name: 'Cat 1' } as never);
      await learningPathCategoriesApi.update('cat-1', { name: 'Cat 1 updated' } as never);
      await learningPathCategoriesApi.remove('cat-1');

      expect(mockApiGet).toHaveBeenNthCalledWith(1, 'platform/learning-path-categories');
      expect(mockApiGet).toHaveBeenNthCalledWith(2, 'platform/learning-path-categories/cat-1');
      expect(mockApiPost).toHaveBeenCalledWith('platform/learning-path-categories', {
        name: 'Cat 1',
      });
      expect(mockApiPatch).toHaveBeenCalledWith('platform/learning-path-categories/cat-1', {
        name: 'Cat 1 updated',
      });
      expect(mockApiDelete).toHaveBeenCalledWith('platform/learning-path-categories/cat-1');
    });
  });

  describe('learningPathsApi', () => {
    it('calls list/get/create/update/remove endpoints', async () => {
      mockApiGet.mockResolvedValue({ data: [] });
      mockApiPost.mockResolvedValue({ data: { id: 'lp-1' } });
      mockApiPatch.mockResolvedValue({ data: { id: 'lp-1' } });
      mockApiDelete.mockResolvedValue(undefined);

      await learningPathsApi.list();
      await learningPathsApi.get('lp-1');
      await learningPathsApi.create({ name: 'LP 1' } as never);
      await learningPathsApi.update('lp-1', { name: 'LP 1 updated' } as never);
      await learningPathsApi.remove('lp-1');

      expect(mockApiGet).toHaveBeenNthCalledWith(
        1,
        'platform/learning-paths',
        expect.objectContaining({ page: 1, per_page: 25 }),
      );
      expect(mockApiGet).toHaveBeenNthCalledWith(2, 'platform/learning-paths/lp-1');
      expect(mockApiPost).toHaveBeenCalledWith('platform/learning-paths', { name: 'LP 1' });
      expect(mockApiPatch).toHaveBeenCalledWith('platform/learning-paths/lp-1', {
        name: 'LP 1 updated',
      });
      expect(mockApiDelete).toHaveBeenCalledWith('platform/learning-paths/lp-1');
    });

    it('uploads media with FormData', async () => {
      mockApiUpload.mockResolvedValue({ data: { id: 'media-1' } });
      const file = new File(['x'], 'cover.png', { type: 'image/png' });

      await learningPathsApi.uploadMedia(file);

      expect(mockApiUpload).toHaveBeenCalledTimes(1);
      expect(mockApiUpload).toHaveBeenCalledWith(
        'platform/learning-paths/media',
        expect.any(FormData),
      );
    });

    it('calls competency and assignment endpoints with payload', async () => {
      mockApiPost.mockResolvedValue({ data: { id: 'lp-1' } });
      mockApiPatch.mockResolvedValue({ data: { id: 'lp-1' } });
      mockApiDelete.mockResolvedValue(undefined);
      mockApiGet.mockResolvedValue({ data: [] });

      await learningPathsApi.linkCompetency('lp-1', { competency_id: 'comp-1' } as never);
      await learningPathsApi.updateCompetencyLocation('lp-1', 'comp-1', {
        location_x: 10,
        location_y: 20,
      });
      await learningPathsApi.unlinkCompetency('lp-1', 'comp-1');
      await learningPathsApi.listCompetencyAssociations();

      await learningPathsApi.assignMailTemplate('lp-1', 'mt-1', {
        location_x: 100,
        location_y: 200,
      });
      await learningPathsApi.assignCertificate('lp-1', 'cert-1', {
        location_x: 300,
        location_y: 400,
      });
      await learningPathsApi.updateMailTemplateLocation('lp-1', {
        location_x: 111,
        location_y: 222,
      });
      await learningPathsApi.updateCertificateLocation('lp-1', {
        location_x: 333,
        location_y: 444,
      });
      await learningPathsApi.detachCertificate('lp-1');

      expect(mockApiPost).toHaveBeenCalledWith('platform/learning-paths/lp-1/competencies', {
        competency_id: 'comp-1',
      });
      expect(mockApiPatch).toHaveBeenCalledWith(
        'platform/learning-paths/lp-1/competencies/comp-1',
        {
          location_x: 10,
          location_y: 20,
        },
      );
      expect(mockApiDelete).toHaveBeenCalledWith(
        'platform/learning-paths/lp-1/competencies/comp-1',
      );
      expect(mockApiGet).toHaveBeenCalledWith('platform/learning-path-competencies');
      expect(mockApiPost).toHaveBeenCalledWith('platform/learning-paths/lp-1/mail-template', {
        mail_template_id: 'mt-1',
        location_x: 100,
        location_y: 200,
      });
      expect(mockApiPost).toHaveBeenCalledWith('platform/learning-paths/lp-1/certificate', {
        certificate_id: 'cert-1',
        location_x: 300,
        location_y: 400,
      });
      expect(mockApiPatch).toHaveBeenCalledWith(
        'platform/learning-paths/lp-1/mail-template/location',
        {
          location_x: 111,
          location_y: 222,
        },
      );
      expect(mockApiPatch).toHaveBeenCalledWith(
        'platform/learning-paths/lp-1/certificate/location',
        {
          location_x: 333,
          location_y: 444,
        },
      );
      expect(mockApiDelete).toHaveBeenCalledWith('platform/learning-paths/lp-1/certificate');
    });
  });

  describe('shop APIs', () => {
    it('calls editor and client shop endpoints', async () => {
      mockApiGet.mockResolvedValue({ data: [] });

      await editorShopApi.list({ page: 2 } as never);
      await editorShopApi.get('lp-1');
      await clientShopApi.list({ search: 'react' } as never);
      await clientShopApi.get('lp-1');
      await clientShopApi.listCategories();

      expect(mockApiGet).toHaveBeenNthCalledWith(1, 'platform/shop/learning-paths', { page: 2 });
      expect(mockApiGet).toHaveBeenNthCalledWith(2, 'platform/shop/learning-paths/lp-1');
      expect(mockApiGet).toHaveBeenNthCalledWith(3, 'shop/learning-paths', { search: 'react' });
      expect(mockApiGet).toHaveBeenNthCalledWith(4, 'shop/learning-paths/lp-1');
      expect(mockApiGet).toHaveBeenNthCalledWith(5, 'shop/learning-path-categories');
    });
  });
});
